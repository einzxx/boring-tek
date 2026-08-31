/* the boring tek — post11, the explainer.

     node post11.mjs                  the clip, shutter shut
     node post11.mjs --blur           the final, four subframes to a frame
     DEMO_FPS=12 node post11.mjs      the fast preview pass
     node post11.mjs --encode-only    re-encode from kept frames

   out to demo/out/post11-1080x1920.mp4, and to that one path every time.

   a calm friendly explainer for the service. white page, big simple type, real
   captured footage of theboringtek.com, and the corner mascot reacting to it
   all the way through. positive, not rage, not dry.

   ---------- it is one composed page, not four passes ----------

   post9 films the site by loading index.html and putting a camera, a cursor and
   a caption layer on top of it, and it cuts to a composed page for the beats
   that are not the site. that is right for a film whose site shots are full
   bleed. this clip is not that: the site is a **card** in the middle of a white
   frame with our own type under it and the mascot in the corner, and the mascot
   has to be alive on every frame including the site ones.

   so the site is an iframe, served from the same origin, inside a clipped card.
   one page, one clock, one render pass, no cuts. the camera is a transform on
   the iframe element rather than on a wrapper inside the page, which means
   index.html is loaded exactly as it is in git and nothing at all is injected
   into it for the framing. what is injected is what post9 injects and for the
   same four reasons: a seeded prng, the rAF shim, a stubbed fetch, and the two
   ambient behaviours a film cannot have firing on their own dice.

   ---------- the crop is the framing, and it is why the nav is gone ----------

   the site's top bar is `position: fixed`, so it sits at the iframe's own top
   whatever the camera does. the card never shows the iframe's top sixty css px,
   so the nav row cannot appear — that is arithmetic rather than a promise, and
   there is a guard on it. everything below the hero is off the bottom of the
   crop for the same reason. who we are and the honest part are never on screen.

   ---------- what is on screen when ----------

   fourteen lines, one screen beat each. seven of them are the site and seven
   are type on white; the captions run over all fourteen in one fixed band, so a
   viewer with the sound off gets the whole script.

   ---------- the one number the brief and the script disagree about ----------

   the brief says thirty seconds and the script is marked exact. the script is
   eighty six words. read at a pace a person would actually use — which is what
   the delivery notes ask for — that is about forty seconds, and the gaps the
   typing and the send need are most of the rest. the script wins: nothing is
   cut and nothing is rushed to hit a number. the run prints what it came out at.
*/

import puppeteer from 'puppeteer-core';
import ffmpeg from 'ffmpeg-static';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

import { speak, VOICE_OUT, VOICES } from './lib/voice.mjs';
import {
  planCaptions, captionFrame, captionCss, captionMarkup, captionPage, describe, bareWord,
} from './lib/captions.mjs';
import {
  planMascot, mascotFrame, mascotMotion, mascotCss, mascotMarkup, mascotRuntime,
  mascotPagePlan, mascotCues, describeMascot, describeMotion, headRect,
  STAGE, SAFE, HEAD_PX, BUBBLE, GRID, HEAD, EYE_CX,
} from './lib/mascot.mjs';
import {
  renderSfx, writeWav, limit, decode, mixdown, voiceEnvelope, applyGain,
  loudness, describeMix, checkUnderVoice, dbfs, SR,
} from './lib/sfx.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'out');
/* ---------- the theme ----------
   `--dark` renders the same clip on the near black page. **the same clip**: the
   script, the beats, the camera, the cut, the mascot's marks and the sound are
   one plan and neither variant knows which one it is. what changes is three
   attributes and nothing else.

     the composed page carries `data-theme` on `<html>`, and index.html's own
     token blocks are already inlined into it by `captionCss` — both of them, the
     light `:root` and the dark override. so the caption ink, the card hairline,
     the end card and the tap ring all follow the attribute without a line of
     theme code anywhere in this file.

     the mascot is planned with `theme`, which is what turns the phosphor glow on:
     `lib/mascot.mjs` carries the two layer glow behind the plate and gates it on
     the dark theme, and its own self test asserts that only dark glows.

     the site inside the card is switched by writing `bt-theme` into the
     iframe's localStorage before index.html runs, which is the same key a
     visitor's own toggle writes. the page then comes up dark on its own: this
     film does not restyle the site, it picks the mode the site already has.

   the guards are not parameterised on any of it. every check the light render
   passes, the dark one passes, on the same numbers. */
const THEME = process.argv.includes('--dark') ? 'dark' : 'light';
const TAG = 'post11-' + THEME;

const FRAMES = path.join(OUT, 'frames-' + TAG);
const SUBS = path.join(OUT, 'subframes-' + TAG);
const VERIFY = path.join(OUT, 'verify-' + TAG);
const MP4 = path.join(OUT, TAG + '-1080x1920.mp4');
const WAV = path.join(OUT, TAG + '-mix.wav');
const STATE = path.join(OUT, TAG + '-1080x1920.json');

const FPS = Number(process.env.DEMO_FPS || 60);
const STEP = 1000 / FPS;
const DSF = STAGE.dsf;
const VW = STAGE.w, VH = STAGE.h;

const argv = process.argv.slice(2);
const ONLY_ENCODE = argv.includes('--encode-only');
/* the voice, the beats, the cut and every plan, printed and then nothing. a cut
   should be arguable before minutes are spent on jpegs, and all four plans in
   here are plain data by construction. */
const PLAN_ONLY = argv.includes('--plan');
const KEEP = argv.includes('--keep-frames');
const BLUR = argv.some(a => a.startsWith('--blur'));
const BLUR_ARG = (argv.find(a => a.startsWith('--blur=')) || '').split('=')[1];
const SUB = BLUR ? Math.max(2, Math.min(12, Number(BLUR_ARG) || 4)) : 1;
const SUBSTEP = STEP / SUB;

/* ---------- the script, and how each line is read ----------
   the copy is exact and is not edited here for any reason.

   what is per line is the **delivery**, and that is the whole point of one
   request per line rather than one for the script: `rate` and `pitch` go
   straight into the ssml prosody tag, so the reading has a shape instead of a
   speed. the light lines run near the neural default, the two that are jokes
   drop and slow, and the close is the slowest thing in the file.

   `gap` is the silence **after** the line, measured on the waveform rather than
   left to the synthesiser's own trailing air. most of them are a breath. two
   are not: the hole after `then type what you want` is where the typing
   happens, and the one after `send it` is where the check mark lands. a viewer
   watching a field fill itself needs the voice to be quiet, which is a cut
   decision rather than a pause.

   `screen` says what the frame is doing on this line. `site` shows the card;
   `white` hides it and the type is the whole picture. */
const LINES = [
  { text: 'ai for business is everywhere now',
    rate: '-4%', pitch: '-1Hz', gap: 0.26, screen: 'white' },
  { text: 'some people do not know why they even need it',
    rate: '+2%', pitch: '+1Hz', gap: 0.22, screen: 'white' },
  /* the first of the two jokes. it is not a punchline that needs a drum, it is
     one that needs the reader to slow down and mean it. */
  { text: 'some know exactly, but have no time',
    rate: '-12%', pitch: '-2Hz', gap: 0.42, screen: 'white' },
  { text: 'and some just need one small thing done',
    rate: '-4%', pitch: '0Hz', gap: 0.30, screen: 'white' },
  /* the address. the one line in the clip that somebody has to be able to write
     down, so it is the slowest of the instructions.

     it is written here as spoken words rather than as the address, and the
     **comma is the whole of the third attempt at it.** three forms were
     synthesised and their word timings compared, because this is a pacing
     problem and pacing is measurable:

       `theboringtek dot com`        one 0.93s run for twelve letters, no word
                                     boundary inside it and therefore no pacing
                                     inside it at all. this is the original
                                     fault, and slowing the rate only makes the
                                     run longer.
       `the boring tek dot com`      five units at an identical 0.015s apart, so
                                     the name does not group and nothing
                                     separates it from the suffix. the address
                                     reads as five items on a list.
       `the boring tek, dot com`     the only one with phrasing in it: a **0.244s
                                     gap** after `tek` against 0.015 everywhere
                                     else, and `tek` itself held at 0.50s rather
                                     than clipped at 0.35. two units, a name and
                                     then a suffix, which is how a person says an
                                     address.

     ---- and then a fourth attempt, because the third lost the `the` ----

     the complaint was that the line reads `boring tek dot com`, and the take's
     own waveform says why, which is not what anybody guessed. **the `the` is
     there and it is loud enough**: 153ms at -17.6 dB, two decibels under the
     loudest word in the line. what is wrong is that the gap in front of it is
     **15ms, exactly the same as every other gap in the run** — so `go to the`
     comes out as one unstressed cluster, the ear takes `the` as the article of
     `go to the ___`, and the name it hears starts at `boring`.

     so this is a grouping fault rather than a level fault, and the fix is a
     boundary. three were synthesised at the same rate and pitch and measured on
     the waveform under each word:

       `go to the ...`     15ms in front of `the`, and it is -2.0 dB under the
                           loudest word. no boundary at all. this is the fault.
       `go to, the ...`    320ms in front of it, but the comma also **drops** it
                           to -4.7 under the loudest. the pause is right and the
                           stress goes the wrong way.
       `go to. the ...`    **503ms** in front of it and 15ms to `boring`, and it
                           comes back up to -0.8 under the loudest word in the
                           line. after a full stop the synthesiser restarts the
                           phrase and gives its first word a real onset, so the
                           `the` is both separated from `go to` and stressed as
                           the head of the name.

     the full stop wins on both numbers, so it is what ships. it is spoken copy
     only: `bareWord` strips a trailing stop after the cards are cut, so nothing
     draws `go to.` — the caption gets two cards, `go to` and then
     `theboringtek.com` on its own, which is the better cut anyway for the one
     line a viewer has to be able to write down.

     it costs 0.58s: the take goes 2.95s to 3.53s and the clip goes with it. that
     is the only retiming in this pass and it is reported by the run.

     the caption still draws `theboringtek.com` — the address as it is actually
     written. that is the only place in this clip where the spoken copy and the
     drawn copy are not the same words, and it is a named exception with a guard
     of its own rather than a hole in one. see SAY_AS below.

     the comma never reaches a caption: `SAY_AS` matches on bare words, so it
     collapses the run whether or not the synthesiser was handed punctuation, and
     the collapse happens before `cardBreak` ever sees the line. */
  { text: 'go to. the boring tek, dot com',
    rate: '-18%', pitch: '-1Hz', gap: 0.30, screen: 'site' },
  { text: 'press the button',
    rate: '-2%', pitch: '+1Hz', gap: 0.52, screen: 'site' },
  { text: 'it does not cost you anything',
    rate: '-10%', pitch: '-1Hz', gap: 0.28, screen: 'site' },
  { text: 'answer a few simple questions',
    rate: '+2%', pitch: '+1Hz', gap: 0.30, screen: 'site' },
  /* the list of three, read as a list of three. the air around each language is
     what the three greeting bubbles land in. */
  { text: 'in english, russian or latvian',
    rate: '-14%', pitch: '0Hz', gap: 0.26, screen: 'site' },
  /* the hole after this one is not a breath and it is not typed here either, it
     is measured. it holds the comedy read, the hand typing under it for exactly
     as long as that read lasts, and then the last two steps of the form done on
     camera. `null` means derived: main() sets it once the comedy take is on
     disk and buildVoice refuses a line whose gap is still null. */
  { text: 'then type what you want',
    rate: '-4%', pitch: '0Hz', gap: null, screen: 'site' },
  /* ---- the rest of the form, narrated ----
     these three lines are new and they exist because the stretch they sit in
     used to be silent. the form was finished off the voice: two and a half seconds of
     a card filling itself with no words over it, which on a rendered strip reads
     as the audio having dropped out rather than as a pause.

     so the voice stays with the form. one step or one field per phrase, and
     every one of them happens on the word that names it, which is the same
     discipline the greetings use: `wordAt` keys the cue to what was said rather
     than to a number.

     the first cut of this fix only narrated the last step, and all that did was
     move the hole: the size step in front of it was still two and a half seconds
     of pressing with nobody talking. the size step gets its own line now, and
     what is left unvoiced is the third of a second it takes to press `next`.

     the registration number is named and never read. a synthesiser reading eight
     digits aloud is thirty seconds of nothing, and a number said out loud is
     also a number a viewer will try to write down. the field is filled with a
     plain placeholder and the voice says what it is, which is all anybody needs.

     the camera is on the top of the card for the first of these, because that is
     where the name and the registration number are, and on the bottom for the
     second, because that is where the country, the email and the send button
     are. each field is on screen when it is named. */
  { text: 'how big your business is',
    rate: '-4%', pitch: '0Hz', gap: 0.28, screen: 'site' },
  { text: 'your name and your registration number',
    rate: '-6%', pitch: '0Hz', gap: 0.30, screen: 'site' },
  { text: 'your website, where you are, and your email',
    rate: '-6%', pitch: '0Hz', gap: 0.34, screen: 'site' },
  /* the send, and then the one word that says it worked.

     the gap after `send it` is the press and the wait, and it is short: the
     press is real, the page disables the button and breathes it, and the stubbed
     post answers after 480ms. what used to follow was three seconds of watching
     a check mark with nobody saying anything, which is the same fault as the
     form filling itself in silence and it sat on the one beat the whole ending
     is built around.

     so `done` lands **on** the check mark rather than after it, and the press is
     timed backwards from that: the tap is placed so the page's own answer
     arrives on the word. it is one syllable on purpose. the tick is the picture
     and this is only the thing you say when something has gone through. */
  { text: 'send it',
    rate: '-6%', pitch: '-1Hz', gap: 0.95, screen: 'site' },
  { text: 'done',
    rate: '-10%', pitch: '-1Hz', gap: 0.80, screen: 'site' },
  /* and then, in this order and it is the third time it has been reordered:
     the tick, then what happens next, then what we do, then the card. the
     report is what the viewer gets for pressing the button, so it answers the
     press; the offering is the pitch and it lands last, on white, with nothing
     else in the frame. */
  { text: 'in one or two days you get your report',
    rate: '-8%', pitch: '-1Hz', gap: 0.38, screen: 'white' },
  /* ---- and the offering, which is a second thing we sell ----
     the list used to follow the report with nothing between them, and read as
     the report's own contents: a viewer heard `you get your report` and then
     four nouns, and the obvious inference is that the report is the app and the
     website and the research. it is not. the report is the free look at your
     business, and building the thing is the other half of what we do and the
     half somebody pays for.

     so it is two lines rather than one, and the first of them exists only to
     say that a second thing has started. it is also why they are two: written as
     one sentence this is sixteen words, which is nearly twice the longest line
     in the clip and about seven seconds of unbroken speech, and this file's own
     rule is short lines with full stops.

     the commas in the second one are what make the list land an item at a time:
     `cardBreak` breaks on them, so websites, research and graphic design each
     get the frame to themselves. */
  { text: 'and if you want it built',
    /* the slowest thing in the clip after the close, and the reason is the
       reason the line exists: it is a turn in the argument rather than a piece
       of information, and read at the file's ordinary pace six short words go by
       in under a second and land as filler. */
    rate: '-20%', pitch: '-1Hz', gap: 0.24, screen: 'white' },
  { text: 'we do apps, websites, research, graphic design, or one small job',
    rate: '+4%', pitch: '+1Hz', gap: 0.32, screen: 'white' },
  /* the close. the slowest and the lowest, and the only line that gets to sit
     under an end card. */
  { text: 'we sit between you and ai',
    rate: '-16%', pitch: '-3Hz', gap: 0.00, screen: 'white' },
];
const TAIL = 1.70;                 /* the end card holds this long after the voice */

/* ---------- where the spoken copy and the drawn copy come apart ----------
   one line, named here, and it is the address.

   every other card in this clip is cut from the words the synthesiser actually
   said, and the guard that says so is the reason this is a named exception
   rather than a loosened check. `markLines` collapses the run of spoken words
   into the one string a reader has to see; `guard` applies the same
   substitution to the spoken string before it compares, and it fails if the
   exception did not fire exactly once. an exception that quietly stopped
   matching would take the guard down with it, which is the only way a check
   like this goes wrong. */
const SAY_AS = [{
  line: 5,
  /* bare words, so the punctuation the delivery needs is invisible here. the
     script says `the boring tek, dot com` and the comma is what makes the
     synthesiser group the name and then pause before the suffix; `runAt`
     compares `bareWord(...)` so the run matches with or without it, and it would
     go on matching if the delivery ever wanted a different mark. */
  say: ['the', 'boring', 'tek', 'dot', 'com'],
  draw: 'theboringtek.com',
  why: 'the synthesiser cannot say the domain as one word and cannot pace it as '
    + 'five, and this is the one line a viewer has to be able to write down',
}];

/* ---------- the comedy line ----------
   the typed line is the one sentence in the clip that is not ours: it is what
   somebody sitting in front of the form is thinking. so it is read by somebody
   else. `aside` is the fourth voice in `lib/voice.mjs`, a us woman, marked as a
   comedy voice so nothing can pick it to narrate. it read in indian english for
   one build and does not any more: a clip this plain does not want its one joke
   marked out by an accent, because the accent becomes the joke, and the line is
   funnier said warmly and straight. the three narrators are male, so a woman is
   audibly somebody else on the first syllable and has nothing to do but be one.

   it is not captioned. the words are already on screen, in the field, being
   typed; a caption of them would be the same sentence twice. so it never
   reaches the caption plan and the drawn-is-spoken guard never sees it, which
   is why it is laid into the voice track by hand rather than through
   `buildVoice`. it is in the duck envelope, so the keys go under it. */
const JOKE = { voice: 'aside', rate: '-14%', pitch: '0Hz', trimDb: -1.5 };
/* how long the stubbed post takes to answer, in `injected()` below. the send
   beat is timed backwards through it so the check mark lands on a word, so it is
   a named constant rather than a number in two places. it has to agree with the
   480 in `injected()` below and `guard` reads that function's own source to
   check that it does, because the two live in different worlds and a stub that
   quietly got slower would move the tick off the word with nothing to show for
   it. */
const STUB = 0.48;
const TYPE_LINE = 9;      /* `then type what you want`, zero based */
const TYPE_LEAD = 0.30;   /* the line's last word to the first keystroke */
/* what is left of the hole after the typing, and it is now one press wide: the
   `next` that confirms what was typed, and the camera arriving on the step it
   opens. the line that asks how big the business is starts the moment that step
   has been drawn, and from there the voice stays with the form to the send. */
const TYPE_TAIL = 1.30;
const SILENCE_DB = -46;            /* a take ends where it falls this far under its own peak */
const PRE = 0.05, POST = 0.08;     /* audio kept either side of a take's own words */
const EDGE_FADE = 0.008;

/* ---------- what the last step is filled with ----------
   four fields, four values, and none of them is a real anything. the name and
   the email are the placeholders the site's own copy would use; the country is
   the plainest three letters in the world; and the registration number is eight
   digits in a row, which is the shape of a registration number and is obviously
   not one. nothing here is a client, a company, a person or an address.

   they are in the order index.html lays them out, and the two lines that narrate
   them name them in that order too, so the eye tracks down the card rather than
   jumping about it. `f-site` is a `type="url"` input and it is handed plain
   text: the page reads `.value` and posts it, there is no native form submit
   anywhere in it, so nothing validates the shape and nothing needs to. */
const FIELDS = [
  { id: 'f-name', key: 'name', text: 'your business' },
  { id: 'f-reg', key: 'reg', text: '12345678' },
  { id: 'f-site', key: 'site', text: 'yourwebsite.com' },
  { id: 'f-country', key: 'country', text: 'usa' },
  { id: 'f-email', key: 'email', text: 'you@yourbusiness.com' },
];

/* what gets typed into the free text box. it is the joke the brief asked for
   and it is the one thing on screen that is not either the script or the site's
   own copy. no client, no name, nothing invented about anybody. */
const TYPED = 'i want ai to do my job but keep my salary';

/* ---------- the frame ----------
   540x960 css at device scale two, which is the 1080x1920 master every clip in
   here renders at.

   the platform safe area is post9's, per edge, in device px: 180 top, 220
   bottom, 140 left and right. everything below is inside it with real air, and
   the brief asked for that in as many words after the first framing sat too
   close to the edges. */
const SAFE_CSS = {
  top: SAFE.top / DSF, bottom: SAFE.bottom / DSF,
  left: SAFE.left / DSF, right: SAFE.right / DSF,
};

/* the card the site is filmed in. it is inside the safe area on every edge with
   six css px to spare on the sides and six at the top, which is twelve device
   px of air beyond the platform floor rather than sitting on it. */
const SCREEN = { x: 76, y: 96, w: 388, h: 420, radius: 16 };

/* the caption's one home, and it does not move for any beat. bottom anchored,
   so a card grows upward out of the line the last one sat on. */
const CAP_BOX = { x: 72, y: 400, w: 396, h: 220 };

/* at least this much clear air between the bottom of the site card and the top
   of the tallest caption there is. it is checked against a measured card rather
   than against the box, which is the mistake the pictogram layer made once. */
const CARD_CLEARANCE = 30;

/* the site's own viewport, inside the iframe. 390 is a phone, which is what the
   brief asked to film at, and it is also what puts the page's stacked lockup on
   screen — THE / BORING / TEK, the way the logo is drawn. 1200 tall so the form
   is rendered in full when it opens: the camera is a transform on the iframe
   rather than a scroll, so anything past the iframe's own viewport does not
   exist to be framed. */
const SITE = { w: 360, h: 1200 };

/* ---------- the end card ----------
   the wordmark stacked on three lines, the way the logo is actually drawn and
   the way index.html sets it, with the address under it in the lockup subline's
   treatment. that is the one place the brand allows michroma small, and there is
   nothing else on the card.

   **stacked rather than on one line, and that is what makes it big.** on one
   line `THE BORING TEK` had to fit inside 300px of a 540 wide frame, which is
   michroma at about 25px: legible, and nowhere near the size the last shot of a
   clip wants. the widest of the three stacked lines is `BORING`, so the same
   width buys more than twice the type.

   **it is centred as a group and the centre is measured, not typed.** the
   wordmark block is three lines tall at a size nothing knows until the face has
   loaded, so `build()` measures both blocks and places them either side of
   `centreY` rather than each at a top somebody guessed. `centreY` is the middle
   of the room above the caption band rather than the middle of the frame: the
   band is fixed at 572..620 and the last line of the clip is still being
   captioned into it while this is on screen, so a card centred on the frame's
   own middle would put the address on top of the words. */
const END = {
  wordmarkW: 330,   /* the width `BORING` occupies, in css px */
  domW: 214,
  gap: 46,          /* clear air between the wordmark block and the address */
  centreY: 336,     /* the group's own centre, in the room above the caption band */
};

/* how long before its own line the site card starts fading in. it was shared
   with the scene layer while there was one; it stays a named constant because
   the card's arrival is the only cut in the clip and a number like that belongs
   somewhere it can be found. */
const CARD_LEAD = 0.42;

/* ---------- the opening, and what is in the card box before the site is ----------
   the card box is empty for the first four lines and it is the top two thirds of
   the frame. this layer fills it, and it fills it with **type**: four scenes, one
   per line, drawn in the same rectangle the site card will occupy — so the
   handover is one thing leaving and another arriving in the same box rather than
   a composition changing shape.

   everything here is drawn in code. no image, no asset, no third font: the words
   are the caption face at a size the captions never reach, the five small faces
   are the mascot's own geometry read out of `lib/mascot.mjs`, and the brain is a
   path generated from a formula. **the corner mascot is not touched by any of
   it** — he keeps his marks, his size and his corner — and this layer sits at
   `z-index: 1`, under him, under the captions and under the card, so it cannot
   get in front of anything however wrong a number in here goes.

   ---------- the look, and why it is two looks ----------
   dark is the one the brief is written for: white deep glow on black, three
   layers of soft blur behind the ink, which is post10's phosphor with the
   numbers walked down the way `lib/mascot.mjs` walked them down. quiet, not neon:
   the widest layer is at seven per cent.

   light gets the same four scenes, the same words and the same timings, and no
   glow at all — ink on paper. a white glow on a white page is nothing and a black
   one is a drop shadow, which the brand bans outright. what light keeps is the
   glitch, at about half the split, so the two variants read as one clip printed
   twice rather than as two clips.

   the orange is the one colour in this file that is neither ink nor paper, and it
   is used in exactly one place: the five faces in scene one, and only while they
   are on. it is the same orange on both themes, because a face that changed
   colour with the page would read as two different characters. it clears the non
   text contrast bar against both grounds, and the run measures that rather than
   claiming it. */
const SC_PAD = 22;         /* css px of air inside the card box */
const SC_LEAD = 1.06;      /* the line height of a stacked scene */
const SC_GAP = 20;         /* between the brain and the words under it */

/* the burnt orange, and it is deliberately not the amber ramp the brand retired:
   that ramp was a set of accents and this is one colour used for one thing.
   #d1600a is 3.90:1 on the white page and 5.17:1 on the black one, so it clears
   the non text bar on both without having to be told to. */
const SC_ORANGE = '#d1600a';

/* the glow, per theme, as blur/alpha pairs. shapes take the first two only: a
   third drop-shadow at fifty px on every svg on every frame buys nothing a viewer
   can see and costs real milliseconds a frame. */
const SC_GLOW = {
  dark: [[8, 0.28], [22, 0.15], [48, 0.07]],
  light: [],
};

/* ---------- the glitch, and the one rule about it ----------
   short and sharp, a few frames, never continuous. so a burst is **a length in
   seconds quantised to whatever frame grid is rendering**, which is the only
   shape that survives being previewed at twelve and shipped at sixty: written in
   frames it would be a quarter of a second on the preview and fifty milliseconds
   on the master, and those are not the same clip.

   and it is computed once per **output** frame and held across every subframe of
   it, for post10's reason: with the shutter open a one frame split written
   against `t` is averaged with three clean captures and lands at a quarter
   strength. a spring rides the shutter. a dropped packet does not. */
const SC_GLITCH = {
  splitDark: 5.0,          /* css px of rgb separation at full heat, dark */
  splitLight: 2.6,         /* and on paper, where it is a hint rather than a look */
  jitter: 3.2,             /* css px the whole scene jumps */
  bleed: 2.4,              /* the wider, fainter second split, scene two only */
  burst: [0.07, 0.14],     /* how long one burst lasts, in seconds */
  every: [0.50, 1.10],     /* and how long between them */
  dutyMax: 0.30,           /* the ceiling on the fraction of a scene's frames that glitch */
  entry: 0.18,             /* how long a word takes to glitch itself into a scene */
};

/* the tube, and it is scene two only. a flicker is not a glitch: it is on for the
   whole line, it is small, and it is what "a dying screen" means when the words
   still have to be readable at phone size. the floor is what keeps them readable
   — the deep dips are one frame of the grid and none of them reaches zero. */
const SC_TUBE = { base: [0.86, 1.0], dipEvery: [0.20, 0.52], dip: [0.54, 0.74], dipFor: 0.06 };

/* ---------- the exchange, inside the handover window ----------
   the handover **window** is the card's own and is not this layer's to choose —
   see `planScenes`. what is this layer's is where inside it the opacity actually
   moves, and the first cut of that got it wrong in a way only a frame shows: one
   scene fading out over the whole half second while the next faded in over the
   same half second put `BUSINESS` and `NEED` on top of each other, both legible,
   for six frames. a dissolve that long between two blocks of type is not a
   handover, it is a double exposure.

   so the window stays and the exchange is a short complementary ramp inside it:
   one goes down exactly as the other comes up, over 0.16s, and their sum is one
   at every instant. never blank, because the sum is one. never mush, because
   only two frames of the preview and ten of the master are mixed at all.

   and it sits at 0.60 of the window rather than in the middle, which is for the
   one handover that is not two scenes: by the time the type is half gone the
   site card is two thirds up, so what a viewer sees is the words coming off an
   arriving page rather than the two of them arguing. */
const SC_CROSS = 0.16;
const SC_CROSS_AT = 0.60;

/* ---------- the five faces ----------
   the mascot's own head, at a third of his size, in orange, each holding a
   different emotion. the poses are the channels `lib/mascot.mjs` animates and the
   numbers are read off its own state table: `surprised` takes the eyes to 2.6 of
   their height, `curious` opens one to 1.8 against the other's 1.1, `thinking`
   drops a lid to about half. they are static here — a face that is on screen for
   a third of a second at a time has no room to act.

   they are placed around the word rather than on it, and the box they sit in is
   the scene's own, so the arithmetic that keeps them off the type is the same
   arithmetic that keeps them inside the safe area. */
/* placed in the scene's own 388x420 box. the two bands they sit in are above and
   below the word, with a good twenty px of air either side of it, and every slot
   leaves room for its own rotation: a 76px square turned eight degrees is 89
   across, and it is the turned box the safe area sees. */
const SC_FACES = [
  { x: 152, y: 4,   s: 68, rot: -5 },
  { x: 292, y: 44,  s: 72, rot: 6 },
  { x: 8,   y: 74,  s: 76, rot: -8 },
  { x: 30,  y: 272, s: 70, rot: 9 },
  { x: 288, y: 262, s: 74, rot: -6 },
];
/* the type inside a head, in the head's own grid units. `AI` is two letters and
   the plate is a circle of radius 30, so what has to fit is the diagonal of the
   text box rather than its width: at this face and weight `AI` is about 0.62em
   across and 0.737em of cap, so the corner of the box sits 0.72F from the centre
   and 30 units of radius takes F up to about 36 before it touches the edge. 30 is
   used, which leaves four units of air at the corner and eleven either side.

   it is deliberately **not** shrunk to be safe. the brief for this is that the
   letters have to read at this size and the heads grow if they will not, so the
   size is picked for the letters and the head is checked against it — the run
   prints the cap it measured and a guard holds it to the same 32 device px floor
   every other piece of copy in this file clears. */
const SC_AI = { text: 'AI', size: 30, baseline: 43 };

/* ---------- the four scenes ----------
   the copy is written lowercase and set uppercase, which is how every other piece
   of type in this file is written: the caption cells, the end card and the site's
   own lockup. `scale` is the size joke in scene four and it is the only place in
   the clip where two words in one block are set at two sizes.

   the words are stacked rather than run on, because the box is 388 css px wide.
   three lines of `WHY I / NEED / AI?!` fit at twice the type one line of
   `WHY I NEED AI?!` could reach, and the whole point of this layer is type big
   enough to carry the top of the frame on its own. */
const SCENES = [
  { key: 'business', line: 1, faces: true, lines: [{ t: 'business' }] },
  { key: 'why', line: 2, tube: true, lines: [{ t: 'why i' }, { t: 'need' }, { t: 'ai?!' }] },
  /* the brain arrives with the line and the words glitch in on the word `but`,
     which is where the line turns from what they know into what they have not
     got. it is keyed to the word rather than to a number, the same way every cue
     in `planSite` is. */
  { key: 'busy', line: 3, brain: true, wordsOn: 'but',
    lines: [{ t: 'but i am' }, { t: 'busy' }] },
  { key: 'small', line: 4,
    lines: [{ t: 'one' }, { t: 'small', scale: 0.34 }, { t: 'thing' }] },
];
/* the floor the captions hold to, and every scene here is well over it. a scene
   that ever measured under it would be type nobody can read on a phone, which is
   the one thing this layer cannot be. */
const SC_MIN_CAP = 32;

/* ---------- the two beats after the card leaves ----------
   the site card goes at 34.87 and the top of the frame is empty from there to
   the end card. two of the four lines in that stretch are about something a
   viewer is being offered, and both of them are drawn in the same box the
   opening scenes and the site card used.

   this is the second cut of both. the first gave the report a page that faded up
   and the offering five flat pictograms, and the pictograms did not work: five
   line drawings in a row read as an icon set rather than as an argument. so the
   offering is a chalkboard mind map now, and the report is a landing rather than
   an arrival — big type taking a hard fault, and then a real page coming in from
   the side and building itself.

   ---------- the days, and the fault they arrive on ----------
   `1/2` over `DAYS`, landing on the word `days`, with the hardest glitch in the
   clip on it: the type is torn into four bands that slide against each other, an
   rgb split on top of that, a noise burst over the whole box and one white frame
   under it. it is a fifth of a second and then it is clean.

   the tearing is four copies of the same type, each clipped to its own
   horizontal band. at rest every band is at zero offset and the four copies
   stack exactly, so what is on screen is one block of type; during a burst node
   writes four different offsets and four different band edges per frame. that is
   what a dropped frame on a panel actually looks like, and it costs nothing when
   it is off. */
const SC_DAYS = {
  line: 16,        /* the script line it belongs to, one based */
  /* the word it lands on, and it is `one` rather than `days`. the line is `in
     one or two days`, so the fault hits on the first number, `1/2` is on screen
     as the second one is said and `DAYS` is on screen as the word is. landing on
     `days` itself was the first cut and it left the type 0.56s to be read before
     the page had to be sliding in — big type nobody has time to read is a
     flicker, not a beat. */
  on: 'one',
  lines: ['1/2', 'days'],
  hold: 0.62,      /* how long it holds after the fault before it leaves */
  exit: 0.14,      /* and it leaves on a fault too, so this is short */
  bands: 4,
};

/* the fault itself. `hard` is the first stretch, where every channel is at full
   and the bands move every frame; `tail` is the stutter after it, where it fires
   on some frames and not others. neither is long: a tv glitch that outstays a
   fifth of a second is a broken render rather than a fault. */
const SC_TV = {
  hard: 0.14, tail: 0.16,
  tear: 34,        /* css px a torn band slides, at full heat */
  split: 8.5,      /* the rgb separation under it, bigger than the opening's 5
                      because this is the one hard glitch in the clip */
  jitter: 5.5,
  noise: 0.34,     /* the noise burst's own opacity at full heat */
  scan: 0.20,
};

/* ---------- the report ----------
   a white page with a green check mark on it, tilted four degrees, because a
   thing placed by a hand is not square to the frame and a thing placed by a
   machine is.

   it comes in **from the side**, clipped to the card box so it enters the frame
   rather than appearing in it, and then it **builds**: the page arrives first
   and the six things on it land one at a time, each dropping the last few pixels
   with its own squash. that is the brick order, and it is why this is a plan
   rather than a transition — a fade would have had the check mark and the page
   arrive on the same instant, which is a picture rather than an event.

   the page is white on both themes because paper is. the check is the site own
   light accent, which is the green a viewer has already seen on the send
   confirmation inside the card, and it is 4.15:1 against the page on either
   theme because the page it sits on does not change. */
const SC_REPORT = {
  line: 16, on: 'report',
  /* 0.42s and it is not a taste. the first cut slid for 0.30s on `POP`, and
     `POP` puts most of its travel in the first fifth: at twelve frames a second
     that is one frame of movement and three of a page sitting still, which reads
     as a pop rather than as a slide. it travels on `DRIFT` now — the file own
     curve for a long move — over five frames of the preview and twenty five of
     the master, and it starts fully outside the box so the first thing a viewer
     sees is an edge coming in. */
  slide: 0.42,
  from: { x: 300, r: -13 },   /* where it comes in from, in the card box own px */
  rest: { r: -4 },            /* and the tilt it settles at */
  brick: 0.075,    /* between one block landing and the next */
  fall: 0.16,      /* how long a block takes to drop into place */
  hold: 0.62,      /* after the last block, before it leaves */
  exit: 0.30,
};
const SC_CHECK = '#0f8a3c';

/* the white frame under the fault. it is not the report own any more — the
   report builds now and has no single contact frame to hide — so it belongs to
   the tv glitch, which is where a white frame belongs. it is lower than it was
   for the same reason it exists: a fault, not a camera flash. */
const SC_FLASH = {
  up: 0.03, down: 0.13, size: 340,
  peak: { dark: 0.45, light: 0.62 },
  max: 0.88,
};

/* ---------- the chalkboard ----------
   `we do apps, websites, research, graphic design, or one small job` had five
   flat pictograms over it and now has a mind map: `website` boxed in yellow in
   the middle of the box, six things around it in chalk ovals, each with an arrow
   into the centre, popping in one at a time.

   **nothing here is a clean vector and that is the whole look.** an oval is a
   full turn plus a twelfth, so the ends overlap the way a hand does not stop
   where it started, and its radius wobbles on two out of phase sines. a straight
   line is not straight and it overshoots at both ends. a box is four separate
   strokes that cross at the corners rather than one closed rectangle. and all of
   it goes through one displacement filter driven by fractal noise, which is what
   turns an even stroke into a chalky one and roughens the letterforms at the
   same time — so the type reads as written rather than as set, without a
   handwriting face this file is not allowed to load.

   the six labels are not the six spoken words, and they cannot be: the line
   names four things and a mind map wants six. the three that **are** spoken land
   on their own words through `wordAt` like every other cue in this file, and the
   three that are not are placed in the gaps between them. the run prints which
   is which. */
const SC_MAP_LINE = 18;
const SC_MAP = {
  cx: 194, cy: 210,          /* the centre of the card box, in its own px */
  bw: 148, bh: 54,           /* the yellow box around the centre word */
  centre: 'website',
  lead: 0.10,                /* how long before its word a node starts arriving */
  pop: 0.26,                 /* and how long the pop takes, overshoot included */
  tail: 0.10,
};
/* `word` is the spoken word it lands on, or null for one placed in a gap, where
   `gap` is how far into the gap it goes. `at` is filled in by `planScenes`. */
/* the ovals are sized to their own label at the type size below, and the two on
   the left are pulled in from where the hexagon would put them: `research` is
   the widest word on the board and at the far left of it, and the wobble plus
   the displacement plus the stroke all add to its outside edge. it clears the
   140 device px border by 66 rather than by 0. */
const SC_NODES = [
  { key: 'apps', t: 'apps', word: 'apps', cx: 194, cy: 50, rx: 44, ry: 26 },
  { key: 'seo', t: 'seo', word: null, gap: 0.32, cx: 296, cy: 130, rx: 40, ry: 25 },
  { key: 'support', t: 'support', word: null, gap: 0.75, cx: 98, cy: 130, rx: 60, ry: 26 },
  { key: 'research', t: 'research', word: 'research', cx: 100, cy: 290, rx: 66, ry: 26 },
  { key: 'design', t: 'design', word: 'graphic', cx: 296, cy: 290, rx: 54, ry: 26 },
  { key: 'social', t: 'social|media', word: 'one', cx: 194, cy: 368, rx: 54, ry: 34 },
];
/* chalk is white on the board and ink on paper; the centre is yellow on both and
   it is a different yellow on each, for the reason the greens are different
   colours in index.html — #ffd34d is 14.1:1 on the near black page and would be
   2.1:1 on the white one, and #a8780c is 3.8:1 on white. */
const SC_CHALK = { yellow: { dark: '#ffd34d', light: '#a8780c' } };

/* the two sounds this pass needs and `lib/sfx.mjs` does not carry: a digital
   fault and a stick of chalk. both are synthesised here, in this file, from the
   same primitives the module own recipes use — no file is loaded, no dependency
   is added and nothing in the shared module moved. see `glitchSfx` and
   `chalkSfx` below. */
const SC_GLITCH_DB = -22;
const SC_CHALK_DB = -30;
const SC_IMPACT_DB = -27;
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(p => { try { return fs.existsSync(p); } catch { return false; } });

/* wcag's non text contrast bar, and its large text bar, which are the same
   number. the four things this file draws as ink are held to it on both themes;
   the two it draws as the site's own furniture are measured and held to the
   light render instead. see the contrast block in `guard`. */
const CONTRAST_MIN = 3.0;

/* ---------- the mix ---------- */
const TARGET_LUFS = -14;
const PEAK_CEILING = -1.0;
const DUCK = 0.60;
const VOICE_TRIM = -1.5;

/* ---------- easing ----------
   the site's own curves, written out in javascript and evaluated per frame. no
   css transition anywhere near a mark: one captured frame carries five or six
   BeginFrames, so a transition resolves about five times too fast. post2 paid
   for that lesson and every file in here has carried it since. */
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const fx = t => ((ax * t + bx) * t + cx) * t;
  const dx = t => (3 * ax * t + 2 * bx) * t + cx;
  return function (p) {
    if (p <= 0) return 0;
    if (p >= 1) return 1;
    let t = p;
    for (let i = 0; i < 8; i++) {
      const e = fx(t) - p;
      if (Math.abs(e) < 1e-6) break;
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    return ((ay * t + by) * t + cy) * t;
  };
}
const GLIDE = bezier(.45, 0, .55, 1);      /* the calm in out */
const DRIFT = bezier(.25, .1, .25, 1);     /* a long move across a page */
const POP = bezier(.34, 1.4, .64, 1);      /* the site's own --spring */
const EASES = { glide: GLIDE, drift: DRIFT, pop: POP };
const lerp = (a, b, p) => a + (b - a) * p;
const clampTo = (v, a, b) => (v < a ? a : v > b ? b : v);

function prng(seed) {
  let s = seed >>> 0;
  return function () {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s |= 0;
    return (s >>> 0) / 4294967296;
  };
}

/* ---------- the voice, one take per line, cached ----------
   the sidecar json is the cache key and the **delivery is part of it**. the copy
   is one half of what a take is and the rate and the pitch are the other; a
   cache that only knew about the words would hand back a line read at the wrong
   speed the moment a delivery note changed, which is silent. post10 found that
   and this is the same guard. */
async function take(i) {
  const L = LINES[i];
  const name = 'post11-l' + String(i + 1).padStart(2, '0');
  const cached = path.join(VOICE_OUT, name + '-calm.json');
  const want = L.text.replace(/\s+/g, ' ').trim();
  if (fs.existsSync(cached)) {
    const j = JSON.parse(fs.readFileSync(cached, 'utf8'));
    if (j.text === want && j.rate === L.rate && j.pitch === L.pitch && fs.existsSync(j.file)) {
      return { ...j, i, cached: true };
    }
  }
  const r = await speak(L.text, { voice: 'calm', name, rate: L.rate, pitch: L.pitch });
  return { ...r, i, cached: false };
}

/* the comedy line, on the same cache discipline as a take: the copy, the voice
   and the delivery are all part of the key, because a cache that only knew the
   words would hand back the narrator reading a line that is not his. */
async function jokeTake() {
  const name = 'post11-typed';
  const cached = path.join(VOICE_OUT, name + '-' + JOKE.voice + '.json');
  const want = TYPED.replace(/\s+/g, ' ').trim();
  if (fs.existsSync(cached)) {
    const j = JSON.parse(fs.readFileSync(cached, 'utf8'));
    if (j.text === want && j.voice === JOKE.voice && j.rate === JOKE.rate
      && j.pitch === JOKE.pitch && fs.existsSync(j.file)) {
      return { ...j, cached: true };
    }
  }
  const r = await speak(TYPED, { voice: JOKE.voice, name, rate: JOKE.rate, pitch: JOKE.pitch });
  return { ...r, cached: false };
}

/* where a take's sound actually starts and stops, off the waveform rather than
   off the word list. the synthesiser's WordBoundary carries a duration shorter
   than the sound — post10 measured 0.12s of speech after a reported word end —
   so a gap trusted to the word list is not the gap that is in the file. */
function audioEdges(pcm) {
  let peak = 0;
  for (let i = 0; i < pcm.length; i++) peak = Math.max(peak, Math.abs(pcm[i]));
  const gate = peak * Math.pow(10, SILENCE_DB / 20);
  const H = Math.round(0.005 * SR);
  const n = Math.floor(pcm.length / H);
  const loud = k => {
    let m = 0;
    for (let j = k * H; j < Math.min((k + 1) * H, pcm.length); j++) m = Math.max(m, Math.abs(pcm[j]));
    return m > gate;
  };
  let a = 0, b = n - 1;
  while (a < n && !loud(a)) a++;
  while (b > a && !loud(b)) b--;
  return { start: +(a * 0.005).toFixed(4), end: +((b + 1) * 0.005).toFixed(4), peak: +dbfs(peak).toFixed(1) };
}

/* the fourteen takes laid on one clock. each one is placed so the silence
   between its own last sound and the next take's first sound is exactly the gap
   that line asked for. the word list comes back re timed by the same offsets,
   so the captions, the beats, the camera and the mascot are all cut against the
   timeline that is in the file. */
function buildVoice(takes) {
  const pcms = takes.map(t => decode(ffmpeg, t.file));
  const edges = pcms.map(audioEdges);
  const offs = [];
  let end = 0;
  for (let i = 0; i < takes.length; i++) {
    /* a derived gap that nobody derived is the one failure that would look like
       a timing choice rather than a bug, so it is refused here. */
    if (i > 0 && LINES[i - 1].gap == null) {
      throw new Error('line ' + i + '\'s gap is still null — main() has to measure it '
        + 'before the takes are laid down');
    }
    const gap = i === 0 ? 0.35 : LINES[i - 1].gap;
    const off = +(end + gap - edges[i].start).toFixed(4);
    offs.push(off);
    end = +(off + edges[i].end).toFixed(4);
  }
  const seconds = +(end + TAIL).toFixed(3);
  const track = new Float32Array(Math.ceil(seconds * SR));
  const words = [];
  const beats = [];
  for (let i = 0; i < takes.length; i++) {
    const pcm = pcms[i], e = edges[i], off = offs[i];
    const a = Math.max(0, Math.round((e.start - PRE) * SR));
    const b = Math.min(pcm.length, Math.round((e.end + POST) * SR));
    const at = Math.round(off * SR) + a;
    const fade = Math.round(EDGE_FADE * SR);
    for (let k = a; k < b; k++) {
      const j = at + (k - a);
      if (j < 0 || j >= track.length) continue;
      let g = 1;
      if (k - a < fade) g = (k - a) / fade;
      else if (b - k < fade) g = (b - k) / fade;
      track[j] += pcm[k] * g;
    }
    const ws = takes[i].words.map(w => ({
      word: w.word, start: +(w.start + off).toFixed(4), end: +(w.end + off).toFixed(4),
    }));
    words.push(...ws);
    beats.push({
      i, text: LINES[i].text, screen: LINES[i].screen, words: ws,
      start: ws[0].start, end: ws[ws.length - 1].end,
      sound: { start: +(off + e.start).toFixed(4), end: +(off + e.end).toFixed(4) },
      wps: +(ws.length / (ws[ws.length - 1].end - ws[0].start)).toFixed(2),
      rate: LINES[i].rate, pitch: LINES[i].pitch,
    });
  }
  const gaps = [];
  for (let i = 1; i < beats.length; i++) {
    gaps.push(+(beats[i].sound.start - beats[i - 1].sound.end).toFixed(3));
  }
  return { track, seconds, words, beats, edges, offs, gaps };
}

/* one take laid onto a track that already exists, with the same edges, the same
   fades and the same kept air as `buildVoice` uses. it is the one piece of that
   function a second voice needs, written out once rather than duplicated inside
   it, because the comedy read is not a fifteenth line and should not have to
   pretend to be one to get into the file. */
function layIn(track, pcm, edge, off, gain) {
  const a = Math.max(0, Math.round((edge.start - PRE) * SR));
  const b = Math.min(pcm.length, Math.round((edge.end + POST) * SR));
  const at = Math.round(off * SR) + a;
  const fade = Math.round(EDGE_FADE * SR);
  for (let k = a; k < b; k++) {
    const j = at + (k - a);
    if (j < 0 || j >= track.length) continue;
    let g = gain;
    if (k - a < fade) g *= (k - a) / fade;
    else if (b - k < fade) g *= (b - k) / fade;
    track[j] += pcm[k] * g;
  }
  return { from: +(off + edge.start).toFixed(3), to: +(off + edge.end).toFixed(3) };
}

/* ---------- where a card is allowed to end ----------
   a card breaks at a sentence end, at a clause mark, or when it is full. this
   script is fourteen short lines with almost no punctuation in them, so left
   alone the cut ran straight through the seams: `dot com press`, `job send it`,
   `time and some` — three words that were never a phrase, and worse, a card
   holding the end of one screen beat and the start of the next while the picture
   changes underneath it.

   so the seams are **marked rather than inferred**. a comma goes on the last
   word of every line, **on the caption's copy only and after the synthesiser has
   already spoken**, `cardBreak` breaks on it, and `punctuation: 'drop'` takes it
   off again before a card is drawn. nothing about the audio or the timing can
   move, and it is exactly what that option was added for — post10's trick, for
   the same reason in a different shape.

   what the marks cannot fake is that the voice said these words in this order,
   and that is checked afterwards against the drawn sequence. */
/* where a run of spoken words sits inside a line, by what they say. it is a
   sequence match rather than an index, for the same reason `wordAt` is: an
   index keys the exception to a line nobody is allowed to edit. */
function runAt(ws, say) {
  for (let i = 0; i + say.length <= ws.length; i++) {
    let ok = true;
    for (let j = 0; j < say.length; j++) {
      if (bareWord(ws[i + j].word).toLowerCase() !== say[j]) { ok = false; break; }
    }
    if (ok) return i;
  }
  return -1;
}

function markLines(beats) {
  const out = [];
  const marked = [];
  /* the named exceptions, each carrying its own count. one hit is the contract;
     zero means it stopped matching and the guard has to say so rather than pass
     quietly, and two would mean a line said the same thing twice and the cards
     no longer line up with the sound. */
  const exceptions = SAY_AS.map(x => ({ ...x, hits: 0, at: null }));
  for (const b of beats) {
    /* the words this line **draws**. ordinarily they are the words it said; a
       named exception collapses a run of them into the one string a reader has
       to see, keeping the run's own start and end so the card is still cut
       against the sound. */
    let ws = b.words;
    for (const x of exceptions) {
      if (x.line !== b.i + 1) continue;
      const at = runAt(ws, x.say);
      if (at < 0) continue;
      ws = [
        ...ws.slice(0, at),
        { word: x.draw, start: ws[at].start, end: ws[at + x.say.length - 1].end },
        ...ws.slice(at + x.say.length),
      ];
      x.hits++;
      x.at = +ws[at].start.toFixed(3);
    }
    ws.forEach((w, k) => {
      const last = k === ws.length - 1;
      const already = /[.!?,;:]["')\]]?$/.test(w.word);
      if (last && !already) marked.push(w.word);
      out.push({ word: last && !already ? w.word + ',' : w.word, start: w.start, end: w.end });
    });
  }
  return { words: out, marked, exceptions };
}

/* a word inside a beat, by what it says rather than by where it sits. keying a
   press to beats[5].words[2] keys it to a line nobody is allowed to edit; keying
   it to "button" survives the copy moving. */
function wordAt(beat, text, which = 0) {
  const hits = beat.words.filter(w => bareWord(w.word).toLowerCase() === text);
  if (!hits.length) throw new Error('line ' + (beat.i + 1) + ' has no word "' + text + '"');
  return hits[Math.min(which, hits.length - 1)];
}

/* ---------- the hand ----------
   post9's, and the reasoning is post9's: a constant rate reads as a machine
   filling a field, which is what it is. every gap is its own number, one is a
   hesitation, and one letter is got wrong, noticed, deleted and typed again
   through the page's own input listener, so the site's state goes wrong and
   comes right the way it would for a visitor. seeded, so the rhythm is uneven
   and identical on every run. */
const NEIGHBOUR = {
  a: 's', b: 'v', c: 'x', d: 'f', e: 'r', f: 'g', g: 'h', h: 'j', i: 'o', j: 'k',
  k: 'l', l: 'k', m: 'n', n: 'm', o: 'p', p: 'o', q: 'w', r: 't', s: 'd', t: 'y',
  u: 'i', v: 'b', w: 'e', x: 'c', y: 'u', z: 'x', ' ': 'v',
};
function humanKeys(text, from, until, seed) {
  const rnd = prng(seed);
  const typoAt = 3 + Math.floor(rnd() * Math.max(1, text.length - 8));
  const hesitateAt = Math.min(text.length - 2, typoAt + 4 + Math.floor(rnd() * 4));
  const keys = [];
  const gaps = [];
  let t = 0;
  for (let i = 0; i < text.length; i++) {
    if (i === hesitateAt) t += 0.18;
    if (i === typoAt) {
      const wrong = NEIGHBOUR[text[i].toLowerCase()] || 'e';
      keys.push({ dt: t, key: wrong, kind: 'typo' });
      t += 0.08 + rnd() * 0.08;
      keys.push({ dt: t, key: 'Backspace', kind: 'fix' });
      t += 0.06 + rnd() * 0.07;
    }
    keys.push({ dt: t, key: text[i], kind: 'key' });
    const g = 0.034 + rnd() * 0.070;
    gaps.push(g);
    t += g;
  }
  const want = until - from;
  const scale = t > want && want > 0 ? want / t : 1;
  return {
    keys: keys.map(k => ({ t: +(from + k.dt * scale).toFixed(4), key: k.key, kind: k.kind })),
    scale, gaps: gaps.map(g => g * scale), typoAt, hesitateAt,
    from, to: +(from + t * scale).toFixed(4),
  };
}

/* ---------- what the camera does over the card ----------
   a shot is a selector, a zoom and an offset, resolved in the browser at the
   moment its leg starts. nothing here is a page coordinate, which is the rule
   record.mjs set and the reason a shot cannot go stale when the form grows a
   step under it.

   two framing rules the card imposes, both of them the page's rather than this
   file's:

     the crop never shows the iframe's own top, because the site's bar is fixed
     there and the brief says the nav is out. the clamp is on the visible top
     edge rather than on the zoom, so it holds at any framing.

     the subline is the widest line index.html sets. a shot that puts it in the
     card and cuts its first and last letter reads as a rendering fault rather
     than as a crop — post9 rendered THE BORING TEK as SHE / 7/RING / MEK doing
     exactly this. so a deep shot is framed **below** the subline rather than
     through it, and `clipCheck` fails the render if one is ever both in the
     card and cut. */
const SNAP = 10 / 60;
/* a shot is either a zoom typed here or a **fit**: with `fit` set the zoom comes
   off the element's own measured width, so a shot frames what it is about rather
   than guessing a number that goes stale the moment the card grows a step. the
   ceiling is the page's rather than this file's — see `ZOOM_CAP`. */
const shot = (sel, o) => ({
  sel, to: o.to || null,
  z: o.z || null, fit: o.fit == null ? null : o.fit,
  dy: o.dy || 0, maxZ: o.maxZ || null, wide: !!o.wide,
  /* where the subject sits in the card. `centre` is the default and is right for
     a thing that fits; `top` and `bottom` are for a form, whose card is a
     different height at every step and whose interesting end is one or the
     other — the question at the top, the send button at the bottom. a shot that
     centres a card taller than the crop frames its middle, which is the one part
     with nothing to look at in it. */
  align: o.align || 'centre',
});

/* ---------- the page's own zoom ceiling ----------
   index.html is laid out edge to edge, and the subline is the widest line it
   sets. the card is 388 css px across, so at zoom z it shows 388/z of the site:
   past the point where that is narrower than the subline, a shot with the
   subline in it cuts its first and last letter — which reads as a rendering
   fault rather than as a crop, and is what rendered THE BORING TEK as
   SHE / 7/RING / MEK the one time post9 tried to zoom past it.

   the answer post9 found was to frame **around** the subline instead of through
   it, and that answer is not available here: the band between the subline and
   the first section below the hero is about a hundred and twenty page px, so a
   frame that clears the subline at the top reaches the sections at the bottom,
   and the brief says those never appear.

   so the ceiling stands and the depth comes from travel. beat five frames the
   whole lockup and beat six travels down onto the button, which is what makes
   the button large in frame — the same conclusion record.mjs reached the first
   time anyone pointed a camera at this page. the number is measured in the
   browser rather than typed, and `clipCheck` fails the render if a subline is
   ever both in the card and cut. */
const ZOOM_CAP = 1.9;

/* how many keystrokes share one tick. see the keyboard note below. */
const KEY_GROUP = 4;

function planSite(beats, jokeDur) {
  const B = i => beats[i];
  const cues = [];        /* one shot actions: a tap, a key, a fill, a call */
  const keys = [];        /* where the keyboard ticks go */
  const legs = [];        /* the camera */
  const fades = [];       /* the card's own opacity */
  const rings = [];       /* the tap indicator and its sound, one per real tap */

  /* every tap is a `click` except one. the send is the press the whole clip is
     about and it sounded exactly like the five presses before it, which is the
     one place in the sound where a press had to mean something. it gets
     `press` — the same mechanism, lower and firmer and four decibels up. */
  const tap = (t, sel, note, sound) => {
    cues.push({ t: +t.toFixed(4), tap: sel, note });
    rings.push({ t: +t.toFixed(4), kind: sound || 'click' });
  };
  /* one field of the last step, filled through the page's own input listeners.
     it carries its own three key ticks: a field completing in silence is the
     fault this whole stretch was rewritten to fix, at the size of one field. */
  const fill = (t, id, note) => {
    const f = FIELDS.find(x => x.id === id);
    if (!f) throw new Error('no field called "' + id + '"');
    cues.push({ t: +t.toFixed(4), fill: f, note });
    for (let k = 0; k < 3; k++) keys.push(+(t + k * 0.07).toFixed(4));
  };
  const call = (t, fn, note) => cues.push({ t: +t.toFixed(4), call: fn, note });
  const key = (t, k) => cues.push({ t: +t.toFixed(4), key: k });

  /* ---- the card arrives on beat five ----
     fitted to the lockup, which is the hero as one block: the mascot, the
     wordmark, the subline and the button. fitting it rather than typing a zoom
     is also what keeps the subline whole by construction, because the subline is
     inside the thing being fitted. */
  const b5 = B(4);
  const cardIn = +(b5.start - CARD_LEAD).toFixed(3);
  fades.push({ t0: cardIn, t1: b5.start + 0.10, to: 1 });
  legs.push({ t0: cardIn, t1: b5.start + 0.10, ease: 'glide',
    to: shot('.lockup', { fit: 14 }), beat: 5, anchor: 'start' });

  /* ---- beat six: down to the button, one tap ----
     the glitch is the page's own shake, played on a frame this file chose rather
     than on the page's dice — the scheduler is frozen for the whole film, so it
     fires once, here, and it is the button asking for the press it is about to
     get.

     the shot is fitted to the cta zone rather than to the button, and the
     ceiling above is why: fitting the button alone asks for a zoom the subline
     cannot survive. what makes the button large in frame is the travel, which is
     most of the height of the hero. */
  const b6 = B(5);
  legs.push({ t0: b6.start - SNAP, t1: b6.start, ease: 'pop',
    to: shot('.hero', { to: '.cta-zone', fit: 8, maxZ: 1.22 }), beat: 6, anchor: 'land' });
  call(b6.start + 0.30, 'glitch', 'the cta shakes, once, on our frame');
  tap(b6.end + 0.10, '.cta', 'the button');

  /* ---- beat seven: the form is open and the first question is up ----
     the press is a third of a second before the beat and every part of that is
     doing something. index.html opens the card by growing a grid row from 0fr
     over .44s and springing .cardin over .52s, and while that runs `.pad` is a
     full height box clipped inside a short one — so a shot measured during it
     frames a card that is still becoming. the camera therefore leaves after the
     page has settled rather than on the press. */
  const b7 = B(6);
  legs.push({ t0: b7.start + 0.45, t1: b7.start + 1.05, ease: 'drift',
    to: shot('.pad', { fit: 10, align: 'top' }), beat: 7, anchor: 'settle' });
  /* the fourth chip is not the one taken. `check my business` is the first, and
     it is the answer this clip is about: it routes to the path with the multi
     pick step on it, which is the two ticks beat eight asks for, and then to a
     free text box, which is beat ten. one answer, and the page does the rest. */
  tap(b7.end + 0.10, '.chips .chip:nth-child(1)', 'check my business');

  /* ---- beat eight: two ticks, two taps ----
     the want step is the one multi pick in the form, so the ticks are real ticks
     rather than two single picks in a row. the second of them is `i will explain
     myself`, which is what puts the free text box on screen two beats later —
     the brief's beat ten is the page's own consequence of beat eight rather than
     a step this file forced.

     the leg waits until the page has drawn the want step: a single pick chip
     marks itself pressed, waits 240ms and advances itself, so a shot measured on
     the beat's first word would frame the card the intent step left behind. */
  const b8 = B(7);
  legs.push({ t0: b8.start + 0.15, t1: b8.start + 0.65, ease: 'drift',
    to: shot('.pad', { fit: 10, align: 'top' }), beat: 8, anchor: 'the want step' });
  tap(b8.start + 0.75, '.chips .chip:nth-child(1)', 'ai for my business');
  tap(b8.start + 1.30, '.chips .chip:nth-child(5)', 'i will explain myself');

  /* ---- beat nine: the same form, in three languages ----
     the language buttons live in the top bar, which the crop excludes, so the
     switch is made through the page's own handler rather than by a tap on a
     control the viewer cannot see. what is on screen is the real thing: the
     question, the chips and the buttons re render, the russian page drops to the
     mono stack the way index.html says it must, and the ticks survive the switch
     because the site never resets progress.

     it ends back on english, because the line typed two beats later is english
     and a latvian form with an english answer in it is a frame that is wrong in
     a way nobody would be able to name. */
  const b9 = B(8);
  legs.push({ t0: b9.start - 0.10, t1: b9.start + 0.40, ease: 'drift',
    to: shot('.pad', { fit: 10, align: 'top' }), beat: 9, anchor: 'start' });
  call(wordAt(b9, 'russian').start - 0.06, 'lang:ru', 'the form in russian');
  call(wordAt(b9, 'latvian').start - 0.06, 'lang:lv', 'the form in latvian');
  call(b9.end + 0.12, 'lang:en', 'and back, before anything is typed');

  /* ---- beat ten: the free text box, typed live ----
     the next press is the last thing the want step needs; the page then draws
     the explain step, whose whole body is a textarea. the camera frames the
     field rather than the card, at the deepest zoom that still holds the field's
     full width — past it the box is cut at both ends, which reads as a broken
     render rather than as a punch in. */
  const b10 = B(9);
  call(b9.end + 0.34, 'next', 'on to the free text box');
  legs.push({ t0: b10.start + 0.10, t1: b10.start + 0.62, ease: 'drift',
    to: shot('.pad textarea', { fit: 10, dy: 6 }), beat: 10, anchor: 'start' });
  tap(b10.end + 0.06, '.pad textarea', 'the field');
  /* the hand types for exactly as long as the comedy voice takes to say the
     line, because they are the same beat: `jokeDur` is measured off that take's
     own waveform and the window is cut to it, so the last key lands on the last
     syllable without either of them being told about the other. forty three
     keystrokes over that window is about twelve characters a second, which is a
     person typing rather than a field filling itself. */
  const typing = humanKeys(TYPED, b10.end + TYPE_LEAD, b10.end + TYPE_LEAD + jokeDur, 0x51c07a);
  for (const k of typing.keys) key(k.t, k.key);

  /* ---- the keyboard, one tick per group of characters ----
     the typing carried no sound at all, which on a clip whose whole middle is a
     form being filled is the one silence nobody reads as a choice. a tick per
     keystroke is forty three sounds inside three and a half seconds, and at any
     level that is a rattle rather than a keyboard. one per four is about three a
     second, which is what a keyboard sounds like from the next desk.

     the typo and the backspace get their own tick wherever they fall, because
     they are the two moments the rhythm breaks and a group that swallowed them
     would be a sound that is not listening to the hand it belongs to. */
  let since = KEY_GROUP;
  for (const k of typing.keys) {
    const own = k.kind !== 'key';
    if (own || since >= KEY_GROUP) { keys.push(+k.t.toFixed(4)); since = 0; }
    since++;
  }

  /* ---- the size step, on camera, in the hole the typing leaves ----
     what is left of that hole after the read and the hand is the room the form
     needs to get from the free text box to the last step: one press to confirm
     what was typed, and one chip for how big the business is. both are real
     presses, both are on camera, and the camera reframes between them because
     the card is a different height at every step. */
  const steps = typing.to;
  tap(steps + 0.40, '.nav .btn:not(.ghost)', 'the explain step is answered');
  /* ---- beat eleven: how big your business is ----
     the chip is pressed on the word `big`, so the step is answered while the
     line that asks it is still being said and the page advances under its own
     tail. the camera arrives first, because a shot resolved while index.html is
     still growing the card frames a card that is still becoming. */
  const b11 = B(10);
  legs.push({ t0: steps + 0.90, t1: steps + 1.40, ease: 'drift',
    to: shot('.pad', { fit: 10, align: 'top' }), beat: 11, anchor: 'the size step' });
  tap(wordAt(b11, 'big').start + 0.10, '.chips .chip:nth-child(2)', 'how big is your business');

  /* ---- beats eleven and twelve: the last step, one field per phrase ----
     this used to be a single `fill` behind a fade and then, for one build, a
     single `fill` hidden inside the card's own entrance. both were the same
     thing dressed differently: a form completing itself while nobody said
     anything. the voice stays with it now, so every field is filled **on the
     word that names it** and the frame is on that field when it happens.

     `wordAt` rather than an offset, for the same reason the greetings use it:
     an offset keys the fill to a line nobody is allowed to edit, and a word
     keys it to what was actually said.

     the registration number is the one that is named and not read. the field
     gets a plain eight digit placeholder and the voice never says a digit. */
  const b12 = B(11), b13 = B(12);
  legs.push({ t0: b12.start - 0.16, t1: b12.start + 0.40, ease: 'drift',
    to: shot('.pad', { fit: 10, align: 'top' }), beat: 12, anchor: 'the last step' });
  fill(wordAt(b12, 'name').start + 0.04, 'f-name', 'the business name');
  fill(wordAt(b12, 'registration').start + 0.30, 'f-reg', 'the registration number, never read aloud');

  /* the bottom of the card for the second phrase, because that is where the
     country, the email and the send button are, and it settles before the line
     starts rather than under it. */
  legs.push({ t0: b13.start - 0.42, t1: b13.start + 0.14, ease: 'glide',
    to: shot('.pad', { fit: 10, align: 'bottom' }), beat: 13, anchor: 'the send button' });
  fill(wordAt(b13, 'website').start + 0.04, 'f-site', 'the website');
  fill(wordAt(b13, 'are').start + 0.06, 'f-country', 'where you are');
  fill(wordAt(b13, 'email').start + 0.10, 'f-email', 'the email');
  call(b13.end + 0.16, 'blur', 'nothing is focused when the send is pressed');

  /* ---- beat fourteen: send, and the confirmation ----
     the camera is already framed on the button, so this is a press and nothing
     else. the two posts are stubbed: nothing leaves the browser and the run
     counts them. the page goes busy, the stub answers after 480ms, and a check
     mark is drawn. */
  const b14 = B(13), b15 = B(14);
  /* the press is placed **backwards from `done`** rather than forwards from
     `send it`. the page answers 480ms after the tap and draws the tick on the
     frame after that, so a tap keyed to the line before it lands the tick
     wherever the gap happens to put it; keyed to the line after it, the tick and
     the word arrive together every time, whatever either take turns out to be.
     STUB is that 480ms, written down once here because two places depend on it.

     it still has to be a press somebody makes after being told to, so the run
     fails if it ever resolves earlier than the line that asks for it. */
  const sendAt = +(b15.start - STUB - 0.07).toFixed(4);
  tap(sendAt, '.nav .btn:not(.ghost)', 'send', 'press');
  /* the tick, and the sound on it. it is the set's `ding`, which is written as
     "a check being drawn" and is the one sound in the file that already meant
     yes, and it now lands under a word rather than in a hole. */
  const confirmAt = +(sendAt + STUB + 0.07).toFixed(4);
  /* and a reframe after the page has answered: the sent state is a much shorter
     card than the last step was, so the frame that held the fields would hold
     mostly white around a check mark. */
  /* it leaves as soon as the page has answered rather than after it has
     finished changing, and that is a correction off rendered frames. the sent
     state is a much shorter card than the last step, so between the tick being
     drawn and the camera arriving the frame is bottom aligned on a card that is
     no longer there: the first cut waited half a second and rendered `start
     again` alone at the top of the frame with white under it. leaving on the
     tick means the target is measured while the card is still shrinking, which
     is a small error the drift closes, and the alternative is a framing that is
     entirely wrong for a fifth of a second. */
  /* the reframe is 0.34s where it was 0.48. the hole after `done` was halved and
     the way to pay for that is at both ends of the tick rather than out of the
     tick itself: the camera arrives on it sooner and the card leaves it faster,
     and the check mark is never cropped, never scaled and never cut short. */
  legs.push({ t0: confirmAt + 0.04, t1: confirmAt + 0.38, ease: 'drift',
    to: shot('.pad', { fit: 10, align: 'top' }), beat: 15, anchor: 'the check mark' });

  /* ---- beat sixteen: the card leaves and the report lands on white ----
     the tick has had about a second and a quarter settled in frame by the time
     this starts, which is what `send it` carries a 2.60s gap for. the report is
     the first thing said after the press because it is what the press buys; the
     offering comes after it and gets the frame to itself. */
  const b16 = B(15);
  /* the exit is 0.22s where it was 0.38, and it starts 0.24s before the line
     where it started 0.40. both halves of that are the same decision: the card
     goes quicker rather than earlier, so the tick keeps every frame it had at
     full size and what gets shorter is the fade over the top of it. */
  fades.push({ t0: b16.start - 0.24, t1: b16.start - 0.02, to: 0 });

  cues.sort((a, b) => a.t - b.t);
  legs.sort((a, b) => a.t0 - b.t0);
  return { cues, legs, fades, rings, typing, keys, sendAt, confirmAt };
}

/* ---------- the mascot's marks ----------
   thirteen marks and seven bubbles.

   **the opening is his.** the top two thirds of the frame is empty for the first
   nine and a half seconds and it is staying that way: the pictogram layer was
   built for it and then taken out again, and the space is Einz's to fill. so
   what carries those four lines is the corner, and it is the one stretch of the
   clip where he talks rather than reacts. `hmm...` lands while the problem is
   still being described and `interesting` lands on the line that turns it into
   something we can do, which is the shape of the argument the voice is making.

   **there is no `unimpressed` anywhere in this clip.** it used to sit on `have
   no time` and it was the right read of that line and the wrong read of the
   film: a corner character who pulls a sour face at the viewer's problem is not
   somebody you then ask to build you something. everything here is warm, and
   `thinking` does the work that state used to do.

   **`agreeing` is kept for the close and nothing else**, because it is the one
   state that earns a `ding` and the ding has to keep meaning yes: it lands on
   the check mark at the send and on the last line, and a third one in the
   opening would make it a punctuation mark instead.

   the turn is set over the opening only. the module's resting bias turns him a
   third of the way into the frame and that is right once there is something in
   the middle of it; over the opening he is turned further into the empty space
   and back out again, and by the time the card fades in he is on the bias and
   every mark after that leaves the channel alone. */
function planMarks(beats, site) {
  const B = i => beats[i];
  const at = x => +x.toFixed(3);
  const typing = site.typing;
  const marks = [];

  /* ---- the four white lines, and he is all there is ---- */
  marks.push({ t: 0.30, state: 'neutral', turn: 0.18 });
  /* the first line has landed and the second is arriving. he has not made his
     mind up about any of it yet, and that is the bubble. */
  marks.push({ t: at(B(0).start + 1.25), state: 'curious', turn: 0.58, bubble: 'hmm...' });
  /* `some know exactly, but have no time`. up and away, one lid down, a slow
     scan over the hold: the smallest state in the table that reads as somebody
     working something out. */
  marks.push({ t: at(B(1).end - 0.50), state: 'thinking', turn: 0.42 });
  /* `and some just need one small thing done`, which is the first line in the
     clip that is a door rather than a problem. he leans in for it and says so. */
  marks.push({ t: at(B(3).start - 0.55), state: 'curious', turn: 0.50, bubble: 'interesting' });
  /* level and back on the bias as the card arrives. */
  marks.push({ t: at(B(4).start - 0.03), state: 'neutral', turn: 0.35 });
  marks.push({ t: at(B(5).start - 0.24), state: 'curious' });
  /* one state across beats seven, eight and nine, carrying the three greetings
     inside its own hold. */
  const b9 = B(8);
  marks.push({
    t: at(B(6).start + 0.10), state: 'neutral',
    bubbles: [
      { t: at(wordAt(b9, 'english').start), text: 'hey' },
      { t: at(wordAt(b9, 'russian').start), text: 'привет' },
      { t: at(wordAt(b9, 'latvian').start), text: 'labdien' },
    ],
  });
  /* the salary line, on the frame it finishes typing, and it is hung off the
     hand rather than off a beat because that is the thing he is reacting to. */
  marks.push({ t: at(typing.to + 0.06), state: 'delighted', bubble: 'nice' });
  /* level through the size step and the last step being filled in. */
  marks.push({ t: at(typing.to + 2.40), state: 'neutral' });
  /* the check mark. he looks up at it on the frame the page draws it, which is
     the beat the whole ending is ordered around. */
  marks.push({ t: at(site.confirmAt + 0.10), state: 'curious' });
  /* he holds the look at the check mark **through** the card leaving now rather
     than levelling off before it. the hole he used to level off in is half what
     it was, and `curious` needs its own entrance, hold and exit inside whatever
     room it has: cutting the room without moving this mark would have been a
     state cut off half way through itself, which the module refuses outright. */
  marks.push({ t: at(B(15).start + 0.35), state: 'neutral' });
  marks.push({ t: at(B(18).start - 0.16), state: 'agreeing', bubble: 'finally' });
  return marks;
}

/* ---------- the opening's own plan ----------
   four scenes, one per line, and the handover between any two of them is the
   **same shape** as the handover from the last one to the site card: one fades
   up over exactly the window the other fades down over. that is what "no jump
   and no blank frame" is, and it is arithmetic rather than a promise.

   the window length is not typed here. it is read off `planSite`'s own card fade
   — `CARD_LEAD` before the line, ending a tenth of a second into it — so the
   four crossfades and the one cut in the clip are literally the same numbers,
   and moving `CARD_LEAD` moves all five together. the last scene's exit is not
   merely the same length as the card's entrance, it **is** the card's entrance
   record, taken by reference.

   every one of the four handovers then lands in a hole in the read: 2.35..2.63,
   4.80..5.01, 7.33..7.75 and 9.60..9.93 are the gaps between the first five
   lines, and the crossfade midpoints fall inside them. nothing was tuned to make
   that true; it falls out of leading each scene by the same 0.42s the card is
   led by. */
function planScenes(beats, cardFade) {
  const at = x => +x.toFixed(3);
  const xf = at(cardFade.t1 - cardFade.t0);
  /* where inside a handover window the opacity moves. one function, used for
     both ends of every scene, so scene k's arrival and scene k-1's departure are
     the same two numbers by construction rather than by agreement. */
  const cross = w => {
    const mid = w.t0 + (w.t1 - w.t0) * SC_CROSS_AT;
    return { t0: at(mid - SC_CROSS / 2), t1: at(mid + SC_CROSS / 2) };
  };
  const scenes = SCENES.map((S, k) => {
    const b = beats[k];
    /* the first scene has no line before it to be led by and nothing to cross
       with, so its entrance runs **before** frame zero and it is already whole on
       the first frame of the clip. a fade up from nothing over the opening second
       reads as a render that has not started yet, and the first frame of a clip
       in a feed is the one frame everybody sees. what it arrives with instead is
       a glitch, added to its own burst list below. */
    const inW = k === 0
      ? { t0: at(-xf), t1: 0 }
      : { t0: at(b.start - CARD_LEAD), t1: at(b.start - CARD_LEAD + xf) };
    const outW = k === SCENES.length - 1
      ? { t0: cardFade.t0, t1: cardFade.t1 }
      : { t0: at(beats[k + 1].start - CARD_LEAD), t1: at(beats[k + 1].start - CARD_LEAD + xf) };
    const seed = (0x5ce0 ^ (k * 0x9e3779b1)) >>> 0;
    const sc = {
      ...S, k, seed,
      beat: { start: b.start, end: b.end },
      in: inW, out: outW, from: Math.max(inW.t0, 0), to: outW.t1,
      /* the windows above are the anchors; these two are where the opacity
         actually moves inside them. both are derived, so nothing here can drift
         away from the card's own arrival. */
      crossIn: cross(inW), crossOut: cross(outW),
      /* `faces` is not initialised here on purpose: it arrives off `SCENES` as
         the flag that says this scene has them, and the schedule below replaces
         it. an empty array written here would overwrite the flag with something
         falsy, which is a silent way to lose five faces. */
      bursts: [], dips: [], wordsAt: null,
    };
    if (outW.t0 <= inW.t1) {
      throw new Error('scene ' + (k + 1) + ' starts leaving at ' + outW.t0
        + ' and has not finished arriving until ' + inW.t1);
    }
    return sc;
  });

  /* ---- the bursts ----
     placed at an uneven interval from the plan's own dice, each one a length in
     seconds rather than in frames, so the same clip previews at twelve and ships
     at sixty with the fault lasting the same amount of time either way. they are
     kept out of the first and last fifth of a scene: a glitch on top of a
     crossfade is two things happening to the same pixels and reads as neither. */
  for (const s of scenes) {
    const r = prng(s.seed ^ 0x9d2c);
    const body = { from: Math.max(s.crossIn.t1 + 0.06, 0.06), to: s.crossOut.t0 - 0.06 };
    let t = body.from + 0.10 + r() * 0.22;
    while (t < body.to) {
      s.bursts.push({
        t: at(t),
        len: +(SC_GLITCH.burst[0] + r() * (SC_GLITCH.burst[1] - SC_GLITCH.burst[0])).toFixed(3),
        force: +(0.62 + r() * 0.38).toFixed(3),
      });
      t += SC_GLITCH.every[0] + r() * (SC_GLITCH.every[1] - SC_GLITCH.every[0]);
    }
    /* the clip opens on a fault rather than on a fade: the first scene is whole
       on frame zero and frame zero is a glitch frame. */
    if (s.k === 0) s.bursts.unshift({ t: 0, len: SC_GLITCH.entry, force: 1 });
    if (!s.bursts.length) throw new Error('scene ' + (s.k + 1) + ' has no glitch in it at all');

    /* the five faces, each on its own uneven schedule and each with a one frame
       dropout inside every window it is up for. hard edges on purpose: they
       glitch in and out, they do not fade, and a fade here would read as five
       little things politely arriving. */
    if (s.faces === true) {
      s.faces = SC_FACES.map((_, i) => {
        const fr = prng((s.seed ^ (0xface + i * 0x2545f491)) >>> 0);
        const win = [];
        let u = body.from + i * 0.11 + fr() * 0.20;
        while (u < body.to - 0.10) {
          const on = 0.30 + fr() * 0.44;
          const t1 = Math.min(u + on, body.to);
          win.push({ t0: at(u), t1: at(t1), blink: at(u + 0.09 + fr() * Math.max(on - 0.20, 0.05)) });
          u = t1 + 0.14 + fr() * 0.30;
        }
        if (!win.length) throw new Error('face ' + i + ' is never on screen');
        return win;
      });
    } else s.faces = [];

    /* the tube, scene two only: an even wobble under everything with one frame
       dips punched into it. the floor is 0.54 and it is a floor rather than a
       taste — under about half the words stop being readable, and a dying screen
       that cannot be read is just a dark frame. */
    if (s.tube) {
      const tr = prng(s.seed ^ 0x7be1);
      let u = body.from;
      while (u < body.to) {
        s.dips.push({ t: at(u), v: +(SC_TUBE.dip[0] + tr() * (SC_TUBE.dip[1] - SC_TUBE.dip[0])).toFixed(3) });
        u += SC_TUBE.dipEvery[0] + tr() * (SC_TUBE.dipEvery[1] - SC_TUBE.dipEvery[0]);
      }
    }

    /* the words of scene three arrive on the word that turns the line, and a
       burst is put on that frame so they glitch in rather than appear. */
    if (s.wordsOn) {
      s.wordsAt = at(wordAt(beats[s.k], s.wordsOn).start);
      s.bursts.push({ t: s.wordsAt, len: SC_GLITCH.entry, force: 1 });
      s.bursts.sort((a, b2) => a.t - b2.t);
    }
  }

  /* ---- the days, on the word `days`, and the fault they land on ----
     `wordAt` again, for the reason every cue in `planSite` uses it: keying this
     to `beats[15].words[4]` would key it to a line nobody is allowed to edit. */
  const bD = beats[SC_DAYS.line - 1];
  const daysAt = at(wordAt(bD, SC_DAYS.on).start);
  const days = {
    key: 'days', k: scenes.length, seed: 0x5ce0 ^ 0x7d19,
    line: SC_DAYS.line, word: SC_DAYS.on, at: daysAt,
    tv: { t0: daysAt, hard: at(daysAt + SC_TV.hard), t1: at(daysAt + SC_TV.hard + SC_TV.tail) },
    out: { t0: at(daysAt + SC_TV.hard + SC_DAYS.hold),
      t1: at(daysAt + SC_TV.hard + SC_DAYS.hold + SC_DAYS.exit) },
    flash: { t0: at(daysAt - SC_FLASH.up), peak: daysAt, t1: at(daysAt + SC_FLASH.down),
      to: THEME === 'dark' ? SC_FLASH.peak.dark : SC_FLASH.peak.light },
    bursts: [], tube: false, faces: [], dips: [],
  };

  /* ---- the report, sliding in and building ----
     the page lands on the word that names it and the bricks follow it, so the
     one thing keyed to the script is the one thing a viewer hears named. */
  const bR = beats[SC_REPORT.line - 1];
  const land = at(wordAt(bR, SC_REPORT.on).start);
  /* the page itself is block zero and it does not queue with the rest: it is
     the thing that slides in, so its window **is** the slide. the first cut had
     it on the same stagger as its own contents, which meant the slide had
     nothing to slide — three hundred milliseconds of an empty box and then a
     finished page, which is the opposite of the point. the five that build are
     the heading, the three lines and the check. */
  const bricks = [{ i: 0, t0: at(land - SC_REPORT.slide), t1: land, page: true }];
  for (let i2 = 1; i2 < 6; i2++) {
    bricks.push({ i: i2, t0: at(land + 0.06 + (i2 - 1) * SC_REPORT.brick),
      t1: at(land + 0.06 + (i2 - 1) * SC_REPORT.brick + SC_REPORT.fall) });
  }
  const lastBrick = bricks[bricks.length - 1].t1;
  const report = {
    key: 'report', k: scenes.length + 1, seed: 0x5ce0 ^ 0x9a71,
    line: SC_REPORT.line, word: SC_REPORT.on, land,
    slide: { t0: at(land - SC_REPORT.slide), t1: land },
    bricks,
    out: { t0: at(lastBrick + SC_REPORT.hold), t1: at(lastBrick + SC_REPORT.hold + SC_REPORT.exit) },
    /* one small fault as it comes in, so the page belongs to the same box the
       torn type just left. nothing after that: a report is not glitchy. */
    bursts: [{ t: at(land - SC_REPORT.slide), len: SC_GLITCH.burst[0], force: 0.8 }],
    tube: false, faces: [], dips: [],
  };
  if (days.out.t1 >= report.slide.t0) {
    throw new Error('the days are still leaving at ' + days.out.t1
      + ' and the report starts sliding in at ' + report.slide.t0);
  }

  /* ---- the chalkboard, one node at a time ----
     three of the six are named out loud and land on their own word; the other
     three are placed in the gap between the two around them, at the fraction
     `gap` names. the map therefore tracks the reading without pretending the
     line says six things when it says four. */
  const bM = beats[SC_MAP_LINE - 1];
  const endIn = at(beats[beats.length - 1].start - 0.30);
  const spoken = SC_NODES.map(n => (n.word ? at(wordAt(bM, n.word).start) : null));
  const nodes = SC_NODES.map((n, i2) => {
    let a = spoken[i2];
    if (a == null) {
      /* the anchors either side of it, so a node in a gap moves when the read
         moves rather than sitting on a number typed here. */
      let before = bM.start;
      for (let q = i2 - 1; q >= 0; q--) if (spoken[q] != null) { before = spoken[q]; break; }
      let after = null;
      for (let q = i2 + 1; q < spoken.length; q++) if (spoken[q] != null) { after = spoken[q]; break; }
      if (after == null) after = bM.end;
      a = at(before + (after - before) * n.gap);
    }
    return { ...n, i: i2, at: a, on: at(a - SC_MAP.lead) };
  });
  for (let i2 = 1; i2 < nodes.length; i2++) {
    if (nodes[i2].on <= nodes[i2 - 1].on + 0.10) {
      throw new Error('the "' + nodes[i2].key + '" node arrives ' + nodes[i2].on
        + ', on top of "' + nodes[i2 - 1].key + '" at ' + nodes[i2 - 1].on);
    }
  }
  /* the centre is there before anything points at it. it arrives at the head of
     the line rather than on a word, because it is the thing the line is about
     rather than one of the things in it. */
  const mapIn = at(bM.start + 0.06);
  const map = {
    key: 'map', k: scenes.length + 2, seed: 0x5ce0 ^ 0x3a1f,
    line: SC_MAP_LINE, centreAt: mapIn, nodes,
    on: mapIn, off: at(Math.min(bM.end + SC_MAP.tail, endIn - 0.14)),
    bursts: [{ t: mapIn, len: SC_GLITCH.burst[0], force: 0.7 }],
    tube: false, faces: [], dips: [],
  };
  if (report.out.t1 >= map.on) {
    throw new Error('the report is still leaving at ' + report.out.t1
      + ' and the chalkboard arrives at ' + map.on);
  }
  if (map.off > endIn) {
    throw new Error('the chalkboard is up at ' + map.off
      + ' and the end card starts arriving at ' + endIn);
  }

  const blocks = [...scenes, days, report, map];
  return { scenes, days, report, map, blocks, endIn, last: map.off,
    until: cardFade.t1, xf, cardFade };
}

/* ---------- one output frame of the opening ----------
   a pure function of the frame index and the plan, which is what makes the
   glitch survive the shutter: every subframe of one output frame is handed the
   same object, so a two frame rgb split is two whole frames of rgb split rather
   than a smear at a quarter strength. */
function rgbOf(hex) {
  const m = hex.replace('#', '').match(/../g).map(x => parseInt(x, 16));
  return m.join(',');
}
function sceneFrame(plan, f, fps) {
  const t = f / fps;
  const o = plan.blocks.map(() => 0);
  for (const s of plan.scenes) {
    if (t < s.in.t0 - 1e-9 || t > s.out.t1 + 1e-9) continue;
    const up = GLIDE(clampTo((t - s.crossIn.t0) / (s.crossIn.t1 - s.crossIn.t0), 0, 1));
    const dn = 1 - GLIDE(clampTo((t - s.crossOut.t0) / (s.crossOut.t1 - s.crossOut.t0), 0, 1));
    o[s.k] = +Math.min(up, dn).toFixed(4);
  }

  let rp = { x: 0, y: 0, r: 0 };
  let flash = 0;

  /* ---- the days, and the fault ----
     the tearing is a function of the **output frame**, held across every
     subframe of it, for post10 reason: a band that moves inside one frame of
     the shutter is averaged back into a blur, and a blur is the one thing a
     torn panel is not. the bands are recomputed every frame while the fault is
     hard and on about half of them while it stutters out. */
  const D = plan.days;
  const bands = [];
  for (let i2 = 0; i2 < SC_DAYS.bands; i2++) {
    bands.push({ t: i2 * 100 / SC_DAYS.bands, b: 100 - (i2 + 1) * 100 / SC_DAYS.bands, x: 0 });
  }
  let noise = 0, scan = 0, tv = 0;
  if (t >= D.at - 1e-9 && t <= D.out.t1 + 1e-9) {
    if (t < D.out.t0) o[D.k] = 1;
    else {
      /* it leaves on a fault as well, so the exit is a stutter rather than a
         fade: on for a frame, off for a frame, gone. */
      const f0 = Math.ceil(D.out.t0 * fps - 1e-9);
      o[D.k] = prng((D.seed ^ 0xd1e ^ ((f + 1) * 2654435761)) >>> 0)() < 0.55 ? 0 : 1;
      if (f >= Math.ceil(D.out.t1 * fps - 1e-9) - 1) o[D.k] = 0;
      if (f === f0) o[D.k] = 1;
    }
    if (t <= D.tv.t1) {
      const hard = t <= D.tv.hard;
      const p = clampTo((t - D.tv.hard) / Math.max(D.tv.t1 - D.tv.hard, 1e-6), 0, 1);
      const r = prng((D.seed ^ ((f + 1) * 0x9e3779b1)) >>> 0);
      /* full while it is hard, then a decaying stutter that fires on some
         frames and not others, which is what stops the tail reading as a fade. */
      tv = hard ? 1 : (r() < 0.55 ? (1 - p) * 0.8 : 0);
      if (tv > 0.01) {
        let edge = 0;
        for (let i2 = 0; i2 < bands.length; i2++) {
          const next = i2 === bands.length - 1 ? 100 : edge + (100 - edge) / (bands.length - i2)
            * (0.55 + r() * 0.9);
          bands[i2] = {
            t: +edge.toFixed(2), b: +(100 - next).toFixed(2),
            x: +((r() * 2 - 1) * SC_TV.tear * tv).toFixed(2),
          };
          edge = next;
        }
        noise = SC_TV.noise * tv * (0.6 + r() * 0.4);
        scan = SC_TV.scan * tv;
      }
    }
  }
  if (t >= D.flash.t0 - 1e-9 && t <= D.flash.t1 + 1e-9) {
    flash = t < D.at
      ? D.flash.to * clampTo((t - D.flash.t0) / Math.max(D.at - D.flash.t0, 1e-6), 0, 1)
      : D.flash.to * (1 - GLIDE(clampTo((t - D.at) / Math.max(D.flash.t1 - D.at, 1e-6), 0, 1)));
  }

  /* ---- the report: it slides in, then it is built ----
     the slide is one ease on two numbers and the build is six, and they are kept
     apart on purpose: the page arriving and the things on it landing are two
     events, and a viewer reads them as two only if they happen at two times. */
  const R = plan.report;
  const bricks = R.bricks.map(() => ({ o: 0, y: 0, s: 1 }));
  if (t >= R.slide.t0 - 1e-9 && t <= R.out.t1 + 1e-9) {
    if (t < R.out.t0) {
      const e = DRIFT(clampTo((t - R.slide.t0) / (R.slide.t1 - R.slide.t0), 0, 1));
      rp = { x: lerp(SC_REPORT.from.x, 0, e), y: 0, r: lerp(SC_REPORT.from.r, SC_REPORT.rest.r, e) };
      /* no fade on the way in. the page is opaque from the first frame and the
         card box own clip is what hides it until its edge is inside the frame,
         which is what makes it slide rather than appear. */
      o[R.k] = 1;
    } else {
      const e = GLIDE(clampTo((t - R.out.t0) / (R.out.t1 - R.out.t0), 0, 1));
      rp = { x: lerp(0, -70, e), y: 0, r: lerp(SC_REPORT.rest.r, -9, e) };
      o[R.k] = +(1 - e).toFixed(4);
    }
    /* every brick falls the last few pixels and squashes when it gets there.
       `POP` overshoots, so the settle is in the curve rather than in a second
       keyframe, which is the same way the mascot states are built. */
    for (const b of R.bricks) {
      if (t < b.t0) continue;
      /* the page is carried by the slide above and takes no drop of its own:
         two transforms on one thing is one of them winning silently. */
      if (b.page) { bricks[b.i] = { o: 1, y: 0, s: 1 }; continue; }
      const q = clampTo((t - b.t0) / (b.t1 - b.t0), 0, 1);
      const e = POP(q);
      bricks[b.i] = {
        o: +clampTo(q * 2.4, 0, 1).toFixed(3),
        y: +lerp(-14, 0, e).toFixed(2),
        s: +lerp(1.14, 1, e).toFixed(4),
      };
    }
  }

  /* ---- the chalkboard, one node at a time ----
     a pop with a small overshoot and nothing else. it is a list of six things
     going up on a board, so what it must not do is perform. */
  const M = plan.map;
  const mapNodes = M.nodes.map(() => 0);
  let mapCentre = 0;
  if (t >= M.on - 1e-9 && t < M.off) {
    o[M.k] = 1;
    mapCentre = POP(clampTo((t - M.centreAt) / SC_MAP.pop, 0, 1));
    for (const n of M.nodes) {
      mapNodes[n.i] = t < n.on ? 0 : POP(clampTo((t - n.on) / SC_MAP.pop, 0, 1));
    }
  }

  let heat = 0, split = 0, dx = 0, dy = 0, bleed = 0;
  for (const s of plan.blocks) {
    if (o[s.k] < 0.02) continue;
    for (const b of s.bursts) {
      /* ceil, not round, and it is not a preference. the visibility test above is
         `t >= on`, so a block's first frame is `ceil(on * fps)` — and a burst
         placed with `round` lands on the frame *before* that whenever the
         fraction is under a half, which is a glitch fired at a thing that is not
         on screen yet. three of the five offering shapes came back with no
         glitch on any frame and this was why. one rule for both, so they cannot
         disagree. */
      const f0 = Math.ceil(b.t * fps - 1e-9), n = Math.max(1, Math.round(b.len * fps));
      if (f < f0 || f >= f0 + n) continue;
      const h = b.force * (1 - (f - f0) / (n + 0.8));
      if (h <= heat) continue;
      const r = prng((s.seed ^ ((f + 1) * 2654435761)) >>> 0);
      heat = h;
      dx = (r() * 2 - 1) * SC_GLITCH.jitter * h;
      dy = (r() * 2 - 1) * SC_GLITCH.jitter * 0.55 * h;
      const cap = THEME === 'dark' ? SC_GLITCH.splitDark : SC_GLITCH.splitLight;
      split = h * (1.4 + r() * Math.max(cap - 1.4, 0.2));
      bleed = s.tube ? h * SC_GLITCH.bleed * (0.45 + r() * 0.55) : 0;
    }
  }

  /* the fault own split and jitter go through the same two channels the
     opening bursts use, so the look composed below has one code path and the
     hard glitch is the same kind of event as the small ones, only bigger. */
  if (tv > 0.01) {
    const r = prng((plan.days.seed ^ 0x7ea2 ^ ((f + 1) * 2246822519)) >>> 0);
    split = Math.max(split, tv * (2.5 + r() * (SC_TV.split - 2.5)));
    dx = (r() * 2 - 1) * SC_TV.jitter * tv;
    dy = (r() * 2 - 1) * SC_TV.jitter * 0.5 * tv;
    heat = Math.max(heat, tv);
  }

  let tube = 1;
  const s2 = plan.scenes.find(s => s.tube);
  if (s2 && o[s2.k] > 0.02) {
    const r = prng((s2.seed ^ ((f + 1) * 2246822519)) >>> 0);
    tube = SC_TUBE.base[0] + r() * (SC_TUBE.base[1] - SC_TUBE.base[0]);
    const n = Math.max(1, Math.round(SC_TUBE.dipFor * fps));
    for (const d of s2.dips) {
      const f0 = Math.round(d.t * fps);
      if (f >= f0 && f < f0 + n) tube = Math.min(tube, d.v);
    }
  }

  const faces = SC_FACES.map(() => 0);
  const s1 = plan.scenes[0];
  if (o[0] > 0.02 && s1.faces.length) {
    const n = Math.max(1, Math.round(0.06 * fps));
    s1.faces.forEach((win, i) => {
      for (const w of win) {
        if (t < w.t0 || t >= w.t1) continue;
        const bf = Math.round(w.blink * fps);
        faces[i] = (f >= bf && f < bf + n) ? 0 : 1;
      }
    });
  }

  let words = 1;
  const s3 = plan.scenes.find(s => s.wordsAt != null);
  if (s3) {
    const f0 = Math.round(s3.wordsAt * fps);
    const n = Math.max(1, Math.round(SC_GLITCH.entry * fps));
    if (f < f0) words = 0;
    else if (f < f0 + n - 1) words = prng((s3.seed ^ 0xb0b ^ ((f + 1) * 2654435761)) >>> 0)() < 0.42 ? 0 : 1;
  }

  /* the look, composed here rather than in the stylesheet, because the glow and
     the split are one text-shadow list and only node knows how hot this frame
     is. the split colours are the site's own --gr and --gc, which is where every
     other file in demo/ takes its rgb separation from. */
  const glow = THEME === 'dark' ? SC_GLOW.dark : SC_GLOW.light;
  const ts = glow.map(([b, a]) => '0 0 ' + b + 'px rgba(255,255,255,' + a + ')');
  const fl = THEME === 'dark'
    ? glow.slice(0, 2).map(([b, a]) => 'drop-shadow(0 0 ' + b + 'px rgba(255,255,255,' + a + '))') : [];
  const rgb = rgbOf(SC_ORANGE);
  const fo = THEME === 'dark'
    ? ['drop-shadow(0 0 8px rgba(' + rgb + ',.45))', 'drop-shadow(0 0 22px rgba(' + rgb + ',.20))'] : [];
  if (split > 0.01) {
    ts.push((-split).toFixed(2) + 'px 0 var(--gr)', split.toFixed(2) + 'px 0 var(--gc)');
    const a = 'drop-shadow(' + (-split).toFixed(2) + 'px 0 var(--gr))';
    const b = 'drop-shadow(' + split.toFixed(2) + 'px 0 var(--gc))';
    fl.push(a, b); fo.push(a, b);
  }
  if (bleed > 0.01) {
    ts.push((-bleed * 2.6).toFixed(2) + 'px 0 rgba(255,60,60,.22)',
      (bleed * 2.6).toFixed(2) + 'px 0 rgba(40,215,255,.22)');
  }

  return {
    o, faces, words: +words.toFixed(3),
    rp: { x: +rp.x.toFixed(2), y: +rp.y.toFixed(2), r: +rp.r.toFixed(3) },
    bricks, bands, noise: +noise.toFixed(4), scan: +scan.toFixed(4), tv: +tv.toFixed(3),
    map: mapNodes.map(v => +v.toFixed(4)), mapCentre: +mapCentre.toFixed(4),
    flash: +flash.toFixed(4),
    dx: +dx.toFixed(2), dy: +dy.toFixed(2), tube: +tube.toFixed(4),
    split: +split.toFixed(2), heat: +heat.toFixed(3),
    ts: ts.length ? ts.join(',') : 'none',
    fl: fl.length ? fl.join(' ') : 'none',
    fo: fo.length ? fo.join(' ') : 'none',
  };
}

/* ---------- the five heads, as svg ----------
   the mascot's own plate at the unit numbers `lib/mascot.mjs` exports, and `AI`
   where the face was. nothing in that module is imported to be run — only its
   geometry is read — so the corner mascot and these five cannot drift apart
   about what a head is, and nothing here can move him.

   **the eyes are gone and they are not coming back.** two slabs 13 units wide on
   a head rendered at about 140 device px are five px of ink each, and at that
   size a pair of them does not read as a face, it reads as a rendering fault —
   which is what a viewing of the last cut said. what a head this small can carry
   is one word, and the word is the one the clip is about.

   the letters are white on the orange rather than the page colour the eyes were.
   the eyes were holes punched in the plate and that is right for a feature; this
   is type, and type that inverts with the theme would be near black inside an
   orange disc on the dark page, which is the one place in the frame a glow
   cannot help it. white is the same on both themes because the plate is. */
function faceSvg(f) {
  const P = HEAD.plate;
  return '<svg viewBox="0 0 ' + GRID + ' ' + GRID + '" width="' + f.s + '" height="' + f.s
    + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">'
    + '<rect class="sc-plate" x="' + P.x + '" y="' + P.y + '" width="' + P.s + '" height="' + P.s
    + '" rx="' + (P.s * HEAD.radius).toFixed(2) + '"/>'
    + '<text class="sc-ai" x="' + (GRID / 2) + '" y="' + SC_AI.baseline + '">' + SC_AI.text + '</text>'
    + '</svg>';
}

/* ---------- the brain ----------
   generated rather than drawn, and the shape it took is the third one: a
   silhouette from an ellipse with two cosines on its radius, a wiggle down the
   middle for the fissure, and twelve folds running **out from the fissure**
   rather than nesting around a centre.

   that last word is the whole of it. the first pass drew the folds as concentric
   arcs, and concentric arcs converge on a point: what rendered was a rose. a
   cortex is folds fanning off a midline, and once they fan the shape reads as a
   brain at a glance.

   **the folds are clipped to the silhouette**, which is the other thing two
   passes got wrong. a fold long enough to reach the edge of the head is a fold
   that runs past it somewhere else on the same stroke, and a line escaping the
   outline is the one thing that makes a drawing read as a mistake. so they are
   drawn deliberately too long and cut by the outline's own path — the two can
   never disagree about where the head ends, which is the same argument the
   mascot's own feature clip is built on.

   all of it is stroked. a filled blob glows as a blob and a stroke glows as a
   line, and a line is the look this scene is in. */
function brainSvg() {
  const cx = 60, cy = 46, R = 44;
  const p = a => {
    const bump = 1 + 0.065 * Math.cos(5 * a + 0.5) + 0.028 * Math.cos(11 * a - 0.6);
    const s = Math.sin(a);
    return [cx + Math.cos(a) * R * 1.24 * bump, cy + s * R * 0.86 * bump * (s > 0 ? 0.86 : 1)];
  };
  const poly = pts => pts.map(([x, y], i) => (i ? 'L' : 'M') + x.toFixed(2) + ' ' + y.toFixed(2)).join(' ');
  const out = [];
  for (let i = 0; i <= 140; i++) out.push(p(-Math.PI / 2 + i / 140 * Math.PI * 2));
  const shell = poly(out) + ' Z';
  const fis = [];
  for (let i = 0; i <= 30; i++) {
    const u = i / 30;
    fis.push([cx + Math.sin(u * Math.PI * 3.1) * 3.0, 2 + u * 84]);
  }
  const folds = [];
  for (const sgn of [-1, 1]) {
    for (let k = 0; k < 6; k++) {
      const y0 = 12 + k * 13.5;
      /* the rows bow away from the middle of the head, so the fan follows the
         dome instead of striping it. */
      const bend = (y0 - 46) * 0.6;
      const seg = [];
      for (let i = 0; i <= 36; i++) {
        const u = i / 36;
        seg.push([cx + sgn * (4 + u * 66),
          y0 + bend * u * u + Math.sin(u * Math.PI * 3.0 + k * 1.7 + (sgn < 0 ? 0.9 : 0)) * 4.6]);
      }
      folds.push(poly(seg));
    }
  }
  return '<svg viewBox="0 0 120 104" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">'
    + '<defs><clipPath id="sc-brain-clip"><path d="' + shell + '"/></clipPath></defs>'
    + '<path class="sc-brain sc-brain-out" d="' + shell + '"/>'
    + '<g clip-path="url(#sc-brain-clip)">'
    + '<path class="sc-brain" d="' + poly(fis) + '"/>'
    + folds.map(d => '<path class="sc-brain" d="' + d + '"/>').join('')
    + '</g>'
    + '<path class="sc-brain" d="M51 80 C51 96 69 96 69 80"/>'
    + '</svg>';
}

/* ---------- the two sounds this file synthesises for itself ----------
   `lib/sfx.mjs` carries eleven recipes and neither of these is one of them, and
   the brief for this pass is one file. so they are built here, out of the same
   two primitives every recipe in that module is built out of — a seeded noise
   source and an exponential decay — and handed to the bus through the same
   `renderSfx` report so the run prints them next to everything else.

   nothing about that is a workaround. a sound that belongs to one clip belongs
   in that clip file; the module carries the ones more than one clip uses, and
   the day a second clip wants a glitch is the day this moves.

   ---- the fault ----
   a dropped packet is not a noise burst, it is a **stutter**: four or five very
   short gates cut out of band passed noise, each one a different width and a
   different band, with silence between them. that is what makes it read as
   digital rather than as a cymbal. a falling square blip underneath gives it a
   pitch to fall off, which is the part the ear reads as `something broke`. */
function glitchSfx({ len = 0.16, seed = 0x917c4 } = {}) {
  const n = Math.round(len * SR), b = new Float32Array(n);
  const r = prng(seed);
  /* the gates, laid down as fractions of the length so the shape survives any
     length this is asked for. */
  let at = 0.02;
  while (at < 0.94) {
    const w = 0.02 + r() * 0.075;
    const a = Math.round(at * n), z = Math.min(n, Math.round((at + w) * n));
    /* one band per gate, and they walk downward, which is what makes four
       bursts read as one event coming apart rather than four events. */
    const hp = 900 + r() * 3800 * (1 - at);
    let y = 0, prev = 0;
    const k = Math.exp(-2 * Math.PI * hp / SR);
    for (let i = a; i < z; i++) {
      const x = r() * 2 - 1;
      y = k * (y + x - prev); prev = x;              /* one pole high pass */
      const q = (i - a) / Math.max(z - a, 1);
      b[i] += y * (1 - q * q) * 0.9;
    }
    at += w + 0.015 + r() * 0.06;
  }
  /* the blip, falling a fifth over the whole length, square so it is obviously
     generated rather than struck. */
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const q = i / n;
    ph += 2 * Math.PI * (220 - 140 * q) / SR;
    b[i] += (Math.sin(ph) > 0 ? 0.34 : -0.34) * Math.exp(-4.5 * q) * (q < 0.6 ? 1 : 0);
  }
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(b[i]));
  if (peak > 0) for (let i = 0; i < n; i++) b[i] /= peak;
  /* ten milliseconds off each end, because a buffer that starts or stops on a
     non zero sample is a click nobody asked for. */
  const e = Math.round(0.006 * SR);
  for (let i = 0; i < e; i++) { b[i] *= i / e; b[n - 1 - i] *= i / e; }
  return b;
}

/* ---- a stick of chalk ----
   thirty five milliseconds, and it is nearly all high frequency: chalk on a
   board has no body at all, it is the sound of grit skipping. band passed noise
   with a very fast decay and a tiny bit of ring around 2.6k, which is the
   board answering. */
function chalkSfx({ len = 0.038, seed = 0x0c8a17 } = {}) {
  const n = Math.round(len * SR), b = new Float32Array(n);
  const r = prng(seed);
  let y = 0, prev = 0;
  const k = Math.exp(-2 * Math.PI * 2400 / SR);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const q = i / n;
    const x = r() * 2 - 1;
    y = k * (y + x - prev); prev = x;
    ph += 2 * Math.PI * 2600 / SR;
    b[i] = (y * 0.95 + Math.sin(ph) * 0.12) * Math.exp(-16 * q);
  }
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(b[i]));
  if (peak > 0) for (let i = 0; i < n; i++) b[i] /= peak;
  const e = Math.round(0.003 * SR);
  for (let i = 0; i < e; i++) { b[i] *= i / e; b[n - 1 - i] *= i / e; }
  return b;
}

/* one buffer into the bus at one time, at one level, and it reports itself the
   way `renderSfx` reports everything else so the run prints one list. */
function addSfx(sfx, src, t, gainDb, kind, from) {
  const g = Math.pow(10, gainDb / 20);
  const at = Math.round(t * SR);
  let peak = 0;
  for (let i = 0; i < src.length; i++) {
    const j = at + i;
    if (j < 0 || j >= sfx.buf.length) continue;
    const v = src[i] * g;
    sfx.buf[j] += v;
    peak = Math.max(peak, Math.abs(v));
  }
  sfx.report.push({ t: +t.toFixed(3), kind, from: from || '',
    seconds: +(src.length / SR).toFixed(3), gain: gainDb,
    peak: +Math.max(-120, dbfs(peak)).toFixed(1), cut: 0 });
  sfx.report.sort((a, b) => a.t - b.t);
}

/* ---------- the report, as bricks ----------
   a white page, six things on it, and every one of them is addressable: the
   markup gives each block its own `data-b` index so `sceneFrame` can land them
   one at a time. that is the whole reason this is not one path — a drawing that
   arrives in one piece cannot be built.

   the order is the order a person would put it together: the page, its heading,
   four lines of nothing in particular, and then the check mark, which is last
   because it is the answer. */
function reportSvg() {
  const b = (i, s) => s.replace('<', '<').replace('class="', 'data-b="' + i + '" class="');
  const bar = (i, y, w) => b(i, '<rect class="sc-rl" x="18" y="' + y + '" width="' + w
    + '" height="4.2" rx="2.1"/>');
  return '<svg viewBox="0 0 120 156" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">'
    + b(0, '<rect class="sc-rp" x="4" y="3" width="112" height="150" rx="6"/>')
    + b(1, '<rect class="sc-rh" x="18" y="22" width="52" height="7" rx="3.5"/>')
    + bar(2, 46, 84) + bar(3, 60, 72) + bar(4, 74, 84)
    /* the check mark, in the site own accent, on the white page. it is drawn
       big and low because it is the thing the page is about, not a detail on
       it: a report that comes back with a tick on it is the whole promise of
       the line it lands under. */
    + b(5, '<path class="sc-rc" d="M40 116 L54 130 L82 96"/>')
    + '</svg>';
}

/* ---------- the chalk primitives ----------
   three functions and none of them draws a straight anything. they are seeded,
   so the board is the same board on every run and on both themes, and they are
   pure geometry — the chalky *texture* is one displacement filter over the lot,
   declared once in `sceneMarkup`.

   `oval` goes a full turn plus a twelfth so its ends overlap; `stroke` bows,
   wanders and overshoots at both ends; `boxOf` is four strokes that cross at the
   corners rather than one closed rect. together that is what stops the map
   reading as a diagram somebody generated. */
function chalkPoly(pts) {
  return pts.map(([x, y], i) => (i ? 'L' : 'M') + x.toFixed(2) + ' ' + y.toFixed(2)).join(' ');
}
function chalkOval(cx, cy, rx, ry, seed) {
  const r = prng(seed), pts = [];
  const w1 = 0.045 + r() * 0.035, w2 = 0.028 + r() * 0.026, p1 = r() * 6.3, p2 = r() * 6.3;
  for (let i = 0; i <= 60; i++) {
    const a = -0.4 + (i / 60) * Math.PI * 2 * 1.08;
    const k = 1 + w1 * Math.sin(a * 3 + p1) + w2 * Math.sin(a * 5 + p2);
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return chalkPoly(pts);
}
function chalkStroke(x0, y0, x1, y1, seed, over = 3) {
  const r = prng(seed), pts = [];
  const dx = x1 - x0, dy = y1 - y0, L = Math.max(Math.hypot(dx, dy), 1e-6);
  const nx = -dy / L, ny = dx / L;
  const ex = (dx / L) * over * (r() * 0.6 + 0.4), ey = (dy / L) * over * (r() * 0.6 + 0.4);
  const bow = (r() * 2 - 1) * Math.min(L * 0.03, 3.2);
  for (let i = 0; i <= 14; i++) {
    const t = -0.02 + (i / 14) * 1.04;
    const w = Math.sin(Math.PI * clampTo(t, 0, 1)) * bow + (r() * 2 - 1) * 0.7;
    pts.push([x0 - ex + dx * t + nx * w, y0 - ey + dy * t + ny * w]);
  }
  return chalkPoly(pts);
}
function chalkBox(x, y, w, h, seed) {
  return [
    chalkStroke(x, y, x + w, y, seed ^ 1, 5),
    chalkStroke(x + w, y, x + w, y + h, seed ^ 2, 5),
    chalkStroke(x + w, y + h, x, y + h, seed ^ 3, 5),
    chalkStroke(x, y + h, x, y, seed ^ 4, 5),
  ];
}
function chalkArrow(x0, y0, x1, y1, seed) {
  const a = Math.atan2(y1 - y0, x1 - x0), hl = 11, sp = 0.42;
  return [
    chalkStroke(x0, y0, x1, y1, seed, 1.5),
    chalkStroke(x1, y1, x1 - Math.cos(a - sp) * hl, y1 - Math.sin(a - sp) * hl, seed ^ 7, 1),
    chalkStroke(x1, y1, x1 - Math.cos(a + sp) * hl, y1 - Math.sin(a + sp) * hl, seed ^ 11, 1),
  ];
}

/* ---------- the mind map ----------
   one svg the size of the card box, so every number in `SC_NODES` is in the same
   px the rest of this layer is written in and nothing has to be scaled to be
   placed.

   each node is its own `<g data-n="i">`, holding its arrow, its oval and its
   label, so `sceneFrame` can pop them one at a time about their own centres. the
   arrows are inside the node they belong to rather than in a layer of their own:
   an arrow that arrives before the thing it points at is an arrow pointing at
   nothing. */
function mapSvg() {
  const M = SC_MAP;
  const node = (n, i) => {
    const dx = M.cx - n.cx, dy = M.cy - n.cy, L = Math.hypot(dx, dy);
    const ux = dx / L, uy = dy / L;
    /* leave the oval at its own edge and stop short of the box, both measured
       off the shapes rather than guessed, so a node that moves keeps its arrow. */
    const er = 1 / Math.hypot(ux / (n.rx + 7), uy / (n.ry + 7));
    const bx = Math.min(Math.abs((M.bw / 2 + 13) / (ux || 1e-6)),
      Math.abs((M.bh / 2 + 13) / (uy || 1e-6)));
    const parts = chalkArrow(n.cx + ux * er, n.cy + uy * er, M.cx - ux * bx, M.cy - uy * bx,
      0x2000 + i * 977).map(d => '<path class="ck" d="' + d + '"/>');
    parts.push('<path class="ck" d="' + chalkOval(n.cx, n.cy, n.rx, n.ry, 0x3000 + i * 613) + '"/>');
    const rows = n.t.split('|');
    rows.forEach((row, j) => {
      parts.push('<text class="ck-t" x="' + n.cx + '" y="'
        + (n.cy + (j - (rows.length - 1) / 2) * 25 + 8).toFixed(1) + '">' + row + '</text>');
    });
    /* the pop is written as a transform on this group, about the node own
       centre, so an overshoot grows the oval and its label together. */
    return '<g class="ck-n" data-n="' + i + '" style="transform-origin:' + n.cx + 'px ' + n.cy + 'px">'
      + parts.join('') + '</g>';
  };
  const centre = chalkBox(M.cx - M.bw / 2, M.cy - M.bh / 2, M.bw, M.bh, 0x4000)
    .map(d => '<path class="ck-y" d="' + d + '"/>').join('')
    + '<text class="ck-yt" x="' + M.cx + '" y="' + (M.cy + 10.5) + '">' + M.centre + '</text>';
  return '<svg viewBox="0 0 ' + SCREEN.w + ' ' + SCREEN.h + '" width="' + SCREEN.w
    + '" height="' + SCREEN.h + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">'
    + '<defs><filter id="sc-chalk" x="-8%" y="-8%" width="116%" height="116%">'
    + '<feTurbulence type="fractalNoise" baseFrequency="0.048" numOctaves="4" seed="7" result="n"/>'
    + '<feDisplacementMap in="SourceGraphic" in2="n" scale="3.6"'
    + ' xChannelSelector="R" yChannelSelector="G"/>'
    + '</filter></defs>'
    + '<g filter="url(#sc-chalk)">'
    + SC_NODES.map(node).join('')
    + '<g class="ck-c" style="transform-origin:' + M.cx + 'px ' + M.cy + 'px">' + centre + '</g>'
    + '</g></svg>';
}

/* the noise burst that goes over the tv glitch. fractal noise at a high base
   frequency is grain; it is rendered once into one rect and its opacity is all
   that moves, so the filter is evaluated on the frames it is visible on and on
   no others. */
function noiseSvg() {
  return '<svg viewBox="0 0 ' + SCREEN.w + ' ' + SCREEN.h + '" width="' + SCREEN.w
    + '" height="' + SCREEN.h + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">'
    + '<defs><filter id="sc-noise" x="0" y="0" width="100%" height="100%">'
    + '<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="19"/>'
    + '</filter></defs>'
    + '<rect width="100%" height="100%" filter="url(#sc-noise)"/></svg>';
}


/* ---------- the opening's markup and its styles ---------- */
function sceneMarkup() {
  return `<div class="sc-root" id="sc-root">
${SCENES.map((S, k) => `  <div class="sc" id="sc${k}" data-key="${S.key}">
    <div class="sc-in" id="sc-in${k}">
      <div class="sc-stack">
${S.brain ? '        <div class="sc-art">' + brainSvg() + '</div>\n' : ''}${S.lines
    .map(L => `        <div class="sc-l"${L.scale ? ` data-scale="${L.scale}"` : ''}>${L.t}</div>`)
    .join('\n')}
      </div>
${S.faces === true ? '      <div class="sc-faces">'
    + SC_FACES.map((f, i) => `<span class="sc-face" id="sc-face${i}" style="left:${f.x}px;top:${f.y}px;`
      + `transform:rotate(${f.rot}deg)">${faceSvg(f)}</span>`).join('')
    + '</div>\n' : ''}    </div>
  </div>`).join('\n')}
  <div class="sc" id="sc${SCENES.length}" data-key="days">
    <div class="sc-in">
${Array.from({ length: SC_DAYS.bands }, (_, i) => `      <div class="sc-tear" id="sc-tear${i}">
        <div class="sc-stack">
${SC_DAYS.lines.map(t => `          <div class="sc-l">${t}</div>`).join('\n')}
        </div>
      </div>`).join('\n')}
    </div>
  </div>
  <div class="sc" id="sc${SCENES.length + 1}" data-key="report" data-clip="1">
    <div class="sc-in sc-clip">
      <div class="sc-stack"><div class="sc-art sc-page" id="sc-page">${reportSvg()}</div></div>
    </div>
  </div>
  <div class="sc" id="sc${SCENES.length + 2}" data-key="map">
    <div class="sc-in">
      <div class="sc-map">${mapSvg()}</div>
    </div>
  </div>
  <div class="sc-noise" id="sc-noise">${noiseSvg()}</div>
  <div class="sc-flash" id="sc-flash"></div>
</div>`;
}

function sceneCss() {
  return `
/* ---------- the opening ----------
   the same rectangle the site card occupies, at z-index 1, which is under the
   card, under the captions and under the mascot. every number a scene draws with
   is inside this box, so the one safe area check the card already passes covers
   the whole layer.

   nothing in here animates in css. every moving value is a custom property
   written per output frame from node, for the reason every file in demo/ writes
   its own: one captured frame carries five or six BeginFrames and a css
   transition resolves about five times too fast. */
.sc-root{
  position:absolute; left:${SCREEN.x}px; top:${SCREEN.y}px;
  width:${SCREEN.w}px; height:${SCREEN.h}px;
  z-index:1; pointer-events:none;
  --sc-dx:0; --sc-dy:0; --sc-f:1; --sc-w:1;
  --rp-x:0; --rp-y:0; --rp-r:0; --tv-scan:0;
${Array.from({ length: SC_DAYS.bands }, (_, i) =>
  `  --tv-t${i}:${(i * 100 / SC_DAYS.bands).toFixed(2)}%; `
  + `--tv-b${i}:${(100 - (i + 1) * 100 / SC_DAYS.bands).toFixed(2)}%; --tv-x${i}:0;`).join('\n')}
  --sc-ts:none; --sc-fl:none; --sc-fo:none;
}
.sc{position:absolute; inset:0; opacity:0; visibility:hidden; will-change:opacity}
.sc-in{position:absolute; inset:0;
  transform:translate3d(calc(var(--sc-dx) * 1px),calc(var(--sc-dy) * 1px),0);
  will-change:transform}
/* the tube is scene two's and only scene two's. it is written on the root like
   everything else and read by one rule, so a flicker cannot leak onto a scene
   that is not about a dying screen. */
#sc-in1{opacity:var(--sc-f)}
/* and the words of scene three do not exist until the line turns. */
#sc2 .sc-l{opacity:var(--sc-w)}

.sc-stack{
  position:absolute; left:${SC_PAD}px; right:${SC_PAD}px; top:${SC_PAD}px; bottom:${SC_PAD}px;
  display:flex; flex-direction:column; align-items:center; justify-content:center;
}
/* the caption face, uppercased, at a size the captions never reach. the size
   itself is measured and written by build(): a stack of three fitted to a 344px
   box is arithmetic no stylesheet can do. */
.sc-l{
  font-family:var(--body); font-weight:700; text-transform:uppercase;
  letter-spacing:0; line-height:${SC_LEAD}; white-space:nowrap;
  color:var(--fg); text-shadow:var(--sc-ts);
}
.sc-art{display:block; margin-bottom:${SC_GAP}px}
/* the brain carries the scene on its own for the second and a half before the
   words glitch in, and at 200px it did not: a rendered frame showed a small
   drawing at the top of the box with a third of the frame empty under it. it is
   the subject of that beat, so it is sized like one, and the fit takes the type
   down to whatever is left rather than the other way round.
   (no backticks in this block: it is inside a template literal and one would end
   the string rather than mark a name.) */
.sc-art svg{display:block; width:236px; height:205px; overflow:visible; filter:var(--sc-fl)}
/* 2.0 viewBox units at 236px wide off a 120 unit box is 3.9 css and 7.9 device
   px of line, which is what a stroke needs to survive the encoder and still
   read as drawn rather than as printed. */
.sc-brain{fill:none; stroke:var(--fg); stroke-width:2.0; stroke-linecap:round; stroke-linejoin:round}
.sc-brain-out{stroke-width:2.6}

/* the faces. orange plate, page coloured eyes and brows, which is the mascot's
   own model — the face reads as a hole punched in the page rather than as an
   illustration sitting on it — with the one colour this file is allowed. */
.sc-faces{position:absolute; inset:0}
.sc-face{position:absolute; display:block; opacity:0; will-change:opacity}
.sc-face svg{display:block; overflow:visible; filter:var(--sc-fo)}
.sc-plate{fill:${SC_ORANGE}}
/* the letters take the layer's own glow list, the same custom property the
   opening type takes, so on the dark page they carry the deep glow and on the
   light one they carry nothing but the split when a burst is on. one property,
   written once a frame, and the heads cannot fall out of step with the words. */
.sc-ai{fill:#f7f8f7; stroke:none; text-anchor:middle;
  font-family:var(--body); font-weight:700; font-size:${SC_AI.size}px;
  letter-spacing:.01em; text-shadow:var(--sc-ts)}

/* ---------- the days, torn ----------
   four copies of the same type, each clipped to its own horizontal band. at rest
   the four insets are the four quarters and the four offsets are zero, so what
   renders is one block of type with three invisible seams in it. during a fault
   node writes eight different numbers and the block comes apart. */
.sc-tear{position:absolute; inset:0; will-change:transform,clip-path}
${Array.from({ length: SC_DAYS.bands }, (_, i) => `#sc-tear${i}{`
  + `clip-path:inset(var(--tv-t${i}) 0 var(--tv-b${i}) 0);`
  + `transform:translate3d(calc(var(--tv-x${i}) * 1px),0,0)}`).join('\n')}

/* ---------- the report ----------
   the page is clipped to the card box so it enters the frame from the side
   rather than appearing inside it, and the clip is what keeps a page that starts
   250px to the right of its resting place inside the platform safe area.

   the two transforms are on two elements on purpose: the slide and the tilt
   belong to the page, and every brick carries its own drop, and one element
   cannot hold two transforms without one of them winning silently. */
.sc-clip{overflow:hidden}
.sc-page svg{display:block; width:212px; height:276px; overflow:visible; filter:var(--sc-fl);
  transform:translate(calc(var(--rp-x) * 1px),calc(var(--rp-y) * 1px))
    rotate(calc(var(--rp-r) * 1deg));
  transform-origin:50% 50%; will-change:transform}
.sc-page,.sc-map{margin-bottom:0}
/* paper, on both themes, because paper does not have a theme. the stroke is what
   makes it a page rather than a white rectangle on the light render, where the
   fill is very nearly the page colour. */
.sc-rp{fill:#f5f7f6; stroke:var(--fg); stroke-width:2.2}
.sc-rh,.sc-rl{fill:#0b0d10; stroke:none}
.sc-rc{fill:none; stroke:${SC_CHECK}; stroke-width:9; stroke-linecap:round; stroke-linejoin:round}
[data-b]{transform-box:fill-box; transform-origin:50% 50%; will-change:transform,opacity}

/* ---------- the chalkboard ----------
   one svg at the card box own size, so SC_NODES is written in the same px as
   everything else in this layer. the displacement filter is declared inside it
   and applied to one group, which is what makes an even stroke chalky and
   roughens the letterforms at the same time. */
.sc-map{display:block}
.sc-map svg{display:block; overflow:visible; filter:var(--sc-fl)}
.ck-n,.ck-c{will-change:transform,opacity}
.ck{fill:none; stroke:var(--fg); stroke-width:2.4; stroke-linecap:round; stroke-linejoin:round}
/* 23px, and it is a floor rather than a taste: at 19 the labels measured 28
   device px of cap against the 32 this file holds every piece of copy to, and
   the run failed on all seven of them. */
.ck-t{fill:var(--fg); stroke:none; text-anchor:middle;
  font-family:var(--body); font-weight:500; font-size:23px}
.ck-y{fill:none; stroke:${SC_CHALK.yellow.light}; stroke-width:3.0;
  stroke-linecap:round; stroke-linejoin:round}
.ck-yt{fill:${SC_CHALK.yellow.light}; stroke:none; text-anchor:middle;
  font-family:var(--body); font-weight:700; font-size:28px;
  letter-spacing:.02em; text-transform:uppercase}
/* the one place in this file where a colour is written twice: chalk yellow has
   to be a different yellow on a black board than on white paper, for the reason
   index.html carries two greens. */
[data-theme=dark] .ck-y{stroke:${SC_CHALK.yellow.dark}}
[data-theme=dark] .ck-yt{fill:${SC_CHALK.yellow.dark}}

/* ---------- the noise burst ----------
   over the whole box and under nothing, on the fault frames only. it is hidden
   rather than transparent when it is off, because a turbulence filter at zero
   opacity is still a turbulence filter being evaluated. */
.sc-noise{position:absolute; inset:0; opacity:0; visibility:hidden;
  pointer-events:none; will-change:opacity;
  /* feathered, because an un-masked noise rect is a grey rectangle with a hard
     edge on the light page: it read as a panel rather than as a burst. the mask
     turns the box into a vignette of grain and takes the edge off the card box
     boundary at the same time. */
  mask-image:radial-gradient(circle at 50% 50%, #000 48%, transparent 92%);
  -webkit-mask-image:radial-gradient(circle at 50% 50%, #000 48%, transparent 92%)}
.sc-noise svg{display:block; opacity:.55}
.sc-noise::after{content:''; position:absolute; inset:0;
  background:repeating-linear-gradient(0deg,
    rgba(255,255,255,var(--tv-scan)) 0 1px, rgba(255,255,255,0) 1px 3px)}
[data-theme=light] .sc-noise::after{
  background:repeating-linear-gradient(0deg,
    rgba(11,13,16,var(--tv-scan)) 0 1px, rgba(11,13,16,0) 1px 3px)}

/* ---------- the flash ----------
   a radial gradient with a transparent edge, in a box the safe area check can
   measure. it paints white on both themes: on black that is a bloom and on white
   it is whatever is under it being blown out, which is the same event. */
.sc-flash{
  position:absolute;
  left:${(SCREEN.w - SC_FLASH.size) / 2}px; top:${(SCREEN.h - SC_FLASH.size) / 2}px;
  width:${SC_FLASH.size}px; height:${SC_FLASH.size}px;
  border-radius:50%; pointer-events:none; opacity:0; will-change:opacity;
  background:radial-gradient(circle,
    rgba(255,255,255,1) 0%, rgba(255,255,255,.62) 30%,
    rgba(255,255,255,.20) 56%, rgba(255,255,255,0) 76%);
}`;
}

/* ---------- the composed page ----------
   the site's own tokens, the caption layer, the mascot layer, the card the site
   is filmed in, the tap ring and the end card. nothing else is in the frame. */
function sceneHtml(cap, capBox, mas) {
  return `<!doctype html>
<html lang="en" data-theme="${THEME}">
<head>
<meta charset="utf-8">
<title>post11</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&family=Space+Grotesk:wght@400;500;700&display=swap">
<style>
:root{
  --mono:ui-monospace,SFMono-Regular,"Cascadia Mono",Menlo,Consolas,"Liberation Mono",monospace;
  --display:"Michroma",var(--mono);
  --body:"Space Grotesk",var(--mono);
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;overflow:hidden;background:var(--bg)}
body{width:${VW}px;height:${VH}px;color:var(--fg);font-family:var(--body)}
.stage{position:relative;width:${VW}px;height:${VH}px;background:var(--bg)}

/* load bearing rather than decoration. with nothing animating at all chrome
   stops producing compositor frames and the screenshot call blocks on frame one
   forever — post2 found it and every clip in demo/ has carried something like it
   since. the site in the card is animating for most of the film, but not for the
   first four lines, which is exactly when this matters. */
.tick{position:absolute;left:-20px;top:-20px;width:2px;height:2px;background:var(--bg);
  will-change:transform;animation:tick 34s cubic-bezier(.45,0,.55,1) infinite alternate}
@keyframes tick{from{transform:translate3d(0,0,0)}to{transform:translate3d(1px,0,0)}}

/* ---------- the card the site is filmed in ----------
   overflow hidden is the crop, and the crop is the framing: the iframe is 390
   css px of real phone inside it and the transform is the camera. the hairline
   and the radius are the site's own — 1px --line and the 16px tier the cards
   below the hero use — and they are what stop a zoom reading as content
   clipping at a boundary nobody can see. */
.screen{
  position:absolute; left:${SCREEN.x}px; top:${SCREEN.y}px;
  width:${SCREEN.w}px; height:${SCREEN.h}px;
  border:1px solid var(--line); border-radius:${SCREEN.radius}px;
  overflow:hidden; background:var(--bg); opacity:0; z-index:2;
  will-change:opacity;
}
.screen iframe{
  position:absolute; left:0; top:0; width:${SITE.w}px; height:${SITE.h}px;
  border:0; transform-origin:0 0; will-change:transform;
}
/* the tap. a ring rather than a pointer, because this is a phone being used
   rather than a desktop being driven, and a mouse arrow over a phone screen is
   the one thing in a clip like this that says it was filmed on a laptop. */
#tap{
  position:absolute; left:0; top:0; width:52px; height:52px; margin:-26px 0 0 -26px;
  border-radius:50%; border:2px solid var(--fg); opacity:0; z-index:6;
  pointer-events:none; will-change:transform,opacity;
}

/* ---------- the end card ---------- */
.end{position:absolute; left:0; right:0; text-align:center; opacity:0; z-index:3;
  pointer-events:none; will-change:opacity}
/* both end card lines hug their own ink rather than spanning the frame. a full
   width box reports the frame's own edges back to the safe area check and proves
   nothing about where the letters are — which is the same mistake the caption
   engine's own note warns about, measured on cells rather than on the row that
   centres them. */
.end{left:50%; right:auto; width:max-content; max-width:${VW - 2 * SAFE_CSS.left}px}
/* the three lines are three blocks in one element rather than three elements,
   so the safe area check measures one box and the group can be centred by
   measuring one height. 1.16 is the site's own stacked lockup leading. */
#end-wm{font-family:var(--display); font-weight:400;
  color:var(--fg); text-transform:uppercase; letter-spacing:0; line-height:1.16;
  white-space:nowrap; transform:translate(-50%,-50%)}
#end-wm span{display:block}
#end-dom{font-family:var(--display); font-weight:400;
  color:var(--sub); text-transform:uppercase; letter-spacing:.18em; line-height:1;
  white-space:nowrap; text-indent:.18em; transform:translate(-50%,-50%)}

/* the pill drops to the mono stack for anything that is not plain ascii, which
   is index.html's own rule for the subline and for the whole russian page. space
   grotesk ships latin and latin ext and no cyrillic, so a greeting in russian
   would otherwise fall back one glyph at a time and set half a word in one face
   and half in another. all or nothing, never per glyph. */
.m-pill[data-mono="1"]{font-family:var(--mono); letter-spacing:0}

${captionCss(cap, capBox)}
${mascotCss(mas)}
${sceneCss()}
</style>
</head>
<body>
<div class="stage">
  <div class="tick"></div>
${sceneMarkup()}
  <div class="screen" id="screen"><iframe id="site" src="/index.html" scrolling="no"></iframe></div>
  <div class="end" id="end-wm"><span>the</span><span>boring</span><span>tek</span></div>
  <div class="end" id="end-dom">theboringtek.com</div>
${captionMarkup(cap)}
${mascotMarkup(mas)}
  <div id="tap"></div>
</div>
<script>
window.__CAP_PLAN = ${JSON.stringify(cap)};
window.__CAP_BOX = ${JSON.stringify(capBox)};
window.__MAS_PLAN = ${JSON.stringify(mascotPagePlan(mas))};
const GRID_UNITS = ${GRID}, SC_AI_SIZE = ${SC_AI.size};
window.__P11 = ${JSON.stringify({ VW, VH, DSF, SCREEN, SITE, END, CAP_BOX,
  SC: { pad: SC_PAD, lead: SC_LEAD, gap: SC_GAP, w: SCREEN.w, h: SCREEN.h } })};
(${captionPage.toString()})();
${mascotRuntime()}
(${stagePage.toString()})();
/* the three layers measure and fit themselves once, after both faces are
   really here. offline everything renders in the mono fallback and looks
   almost right, which is the worst kind of wrong to fit type against —
   og.mjs has exited non zero on exactly that since the day it was written. */
document.fonts.load('400 40px Michroma')
  .then(() => document.fonts.load('700 44px "Space Grotesk"'))
  .then(() => document.fonts.load('500 26px "Space Grotesk"'))
  .then(() => document.fonts.ready)
  .then(() => {
    window.__built = {
      ...window.__stage.build(),
      cap: window.__cap.build(),
      mas: window.__mas.build(),
      caps: window.__mas.caps(),
    };
  });
</script>
</body>
</html>`;
}

/* ---------- the composed page's own half ----------
   serialised in with .toString(), so it closes over nothing: everything it needs
   arrives on window.__P11. it writes numbers to elements and decides nothing,
   which is the same split lib/captions.mjs and lib/mascot.mjs are built on. */
function stagePage() {
  const P = window.__P11;
  const screen = document.getElementById('screen');
  const site = document.getElementById('site');
  const tap = document.getElementById('tap');
  const wm = document.getElementById('end-wm');
  const dom = document.getElementById('end-dom');
  const pill = document.getElementById('m-pill');
  const scRoot = document.getElementById('sc-root');
  const scenes = [...document.querySelectorAll('.sc')];
  const scFaces = [...document.querySelectorAll('.sc-face')];
  const scFlash = document.getElementById('sc-flash');
  const scNoise = document.getElementById('sc-noise');
  const scBricks = [...document.querySelectorAll('[data-b]')]
    .sort((a, b) => +a.dataset.b - +b.dataset.b);
  const scMapNodes = [...document.querySelectorAll('.ck-n')]
    .sort((a, b) => +a.dataset.n - +b.dataset.n);
  const scMapCentre = document.querySelector('.ck-c');

  /* michroma is proportional and the tracking is heavy, so both end card lines
     are measured on a canvas at 100px and divided down to the width they should
     occupy rather than given a guessed size. the string is measured **as it
     renders** — uppercase — because canvas measureText knows nothing about
     text-transform and caps are about fifteen per cent wider. */
  function fit(el, want, track) {
    /* the widest line the element sets, which on a stacked wordmark is `BORING`
       and on a single line is the line. measuring `textContent` would measure
       three lines run together, which is a fifth of the real size. */
    const lines = el.querySelector('span')
      ? [...el.querySelectorAll('span')].map(e => e.textContent.toUpperCase())
      : [el.textContent.toUpperCase()];
    const cv = document.createElement('canvas').getContext('2d');
    cv.font = '400 100px Michroma';
    let em = 0;
    for (const s of lines) em = Math.max(em, (cv.measureText(s).width + track * 100 * s.length) / 100);
    el.style.fontSize = (want / em).toFixed(3) + 'px';
    return +(want / em).toFixed(2);
  }

  /* ---------- the opening's type, fitted ----------
     one size per scene, taken off the widest **unscaled** line so that the size
     joke in scene four cannot decide how big the other two words are, then
     brought down again if the stack is taller than the box it is in. width wins
     on one word and height wins on three, and both are measured rather than
     assumed: a stack fitted on width alone runs off the bottom of the card the
     moment a scene grows a line, which is the same fault the site shots' `fit`
     note is about.

     the cap height is measured back off the canvas at the size that was written,
     because "is this legible on a phone" is a number and this is the number. */
  function fitScene(el) {
    const cv = document.createElement('canvas').getContext('2d');
    /* the torn block holds four identical copies of its own type, one per band,
       and fitting eight lines into a box meant for two would have set the days
       at a quarter of their size. one copy is measured and every copy is
       written, which is also the only way the four can stay stacked. */
    const bands = [...el.querySelectorAll('.sc-tear')];
    const lines = bands.length
      ? [...bands[0].querySelectorAll('.sc-l')]
      : [...el.querySelectorAll('.sc-l')];
    const all = [...el.querySelectorAll('.sc-l')];
    const boxW = P.SC.w - 2 * P.SC.pad;
    const boxH = P.SC.h - 2 * P.SC.pad;
    cv.font = '700 100px "Space Grotesk"';
    let em = 0, rows = 0;
    for (const L of lines) {
      const k = +L.dataset.scale || 1;
      em = Math.max(em, cv.measureText(L.textContent.toUpperCase()).width / 100 * k);
      rows += k * P.SC.lead;
    }
    const art = el.querySelector('.sc-art');
    const artH = art ? art.getBoundingClientRect().height + (lines.length ? P.SC.gap : 0) : 0;
    /* a block with no type in it — the report, the five offering shapes — has
       nothing to fit and says so, rather than dividing the box by a zero em and
       writing Infinity into a font size. */
    if (!lines.length) {
      const out0 = { key: el.dataset.key, px: null, by: 'nothing to fit', art: +artH.toFixed(1),
        lines: [], capPx: null };
      out0.ink = inkOf(el);
      return out0;
    }
    let size = boxW / em;
    let by = 'width';
    if (artH + size * rows > boxH) { size = (boxH - artH) / rows; by = 'height'; }
    const out = { key: el.dataset.key, px: +size.toFixed(2), by, art: +artH.toFixed(1), lines: [] };
    for (const L of all) L.style.fontSize = (size * (+L.dataset.scale || 1)).toFixed(2) + 'px';
    for (const L of lines) {
      const k = +L.dataset.scale || 1;
      const px = size * k;
      cv.font = '700 ' + px.toFixed(2) + 'px "Space Grotesk"';
      const m = cv.measureText('H');
      const cap = m.actualBoundingBoxAscent || px * 0.7;
      out.lines.push({ t: L.textContent, px: +px.toFixed(1), capPx: +(cap * P.DSF).toFixed(1) });
    }
    out.capPx = Math.min(...out.lines.map(l => l.capPx));
    out.ink = inkOf(el);
    return out;
  }
  /* the ink, not the box it is laid out in. the stack is a full height flex
     container and reporting its rect would report the card's own edges back to
     the safe area check, which proves nothing about where the letters are. */
  function inkOf(el) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const e of el.querySelectorAll('.sc-l, .sc-art, .sc-art svg, .sc-face, .sc-map svg')) {
      const r = e.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top);
      x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom);
    }
    if (x1 < x0) return null;
    /* a block that declares itself clipped is measured through its clip. the
       report slides in from 250px outside the card box and a rect that ignored
       the `overflow: hidden` it is inside would report ink at a border it is
       not within a hundred px of. */
    if (el.dataset && el.dataset.clip) {
      const c = scRoot.getBoundingClientRect();
      x0 = Math.max(x0, c.left); y0 = Math.max(y0, c.top);
      x1 = Math.min(x1, c.right); y1 = Math.min(y1, c.bottom);
      if (x1 <= x0 || y1 <= y0) return null;
    }
    return { left: +x0.toFixed(1), top: +y0.toFixed(1), right: +x1.toFixed(1), bottom: +y1.toFixed(1) };
  }

  window.__stage = {
    ready: false,
    build() {
      const a = fit(wm, P.END.wordmarkW, 0);
      const b = fit(dom, P.END.domW, 0.18);
      /* the group is placed as a group, after the fit, because the wordmark's
         height is three lines of a size nothing knew until the face loaded. both
         blocks translate about their own centres, so what is written here is
         each block's centre and the arithmetic is one addition. */
      const wh = wm.getBoundingClientRect().height;
      const dh = dom.getBoundingClientRect().height;
      const total = wh + P.END.gap + dh;
      const top = P.END.centreY - total / 2;
      wm.style.top = (top + wh / 2).toFixed(2) + 'px';
      dom.style.top = (top + wh + P.END.gap + dh / 2).toFixed(2) + 'px';
      this.ready = true;
      return {
        wordmarkPx: a, domPx: b,
        end: { top: +top.toFixed(1), bottom: +(top + total).toFixed(1),
          wordmark: +wh.toFixed(1), dom: +dh.toFixed(1) },
        scenes: scenes.map(fitScene),
        /* the `AI` inside a head, measured on the rendered svg rather than on
           the unit it was written in: the text is set in the head's own grid and
           the head is scaled to its css size, so what a viewer sees is the
           product of two numbers and only the browser knows it. */
        ai: (() => {
          const t = document.querySelector('.sc-ai');
          const pl = document.querySelector('.sc-plate');
          if (!t || !pl) return null;
          /* the scale from grid units to css px, off the element's own screen
             matrix rather than off its bounding rect. every head is rotated a
             few degrees and a rect is the axis aligned box of a rotated square,
             which is up to eight per cent wider than the square — measuring
             through it reported the letters eight per cent bigger than they are.
             the ctm carries the rotation, so `hypot(a, b)` is the scale with the
             turn divided back out. */
          const m = t.getScreenCTM();
          const k = Math.hypot(m.a, m.b);
          const b = t.getBBox(), q = pl.getBBox();
          return { text: t.textContent, unit: SC_AI_SIZE,
            px: +(SC_AI_SIZE * k).toFixed(1),
            capPx: +(b.height * k * P.DSF).toFixed(1),
            widthPx: +(b.width * k * P.DSF).toFixed(1),
            plate: +(q.width * k * P.DSF).toFixed(1) };
        })(),
        /* the chalk, measured off the rendered type rather than off the css, so
           `is this readable on a phone` is the same kind of number for the board
           as it is for the opening scenes. */
        chalk: [...document.querySelectorAll('.ck-yt, .ck-t')].map(e => {
          const cs = getComputedStyle(e);
          const cv = document.createElement('canvas').getContext('2d');
          cv.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
          const m = cv.measureText('H');
          const cap = m.actualBoundingBoxAscent || parseFloat(cs.fontSize) * 0.7;
          return { t: e.textContent, px: +parseFloat(cs.fontSize).toFixed(1),
            capPx: +(cap * P.DSF).toFixed(1) };
        }),
        /* the layer's own depth, read back rather than trusted to the
           stylesheet. it has to be under the card, under the captions and under
           the mascot: everything in it is temporary and nothing in it may ever
           be in front of the site. */
        scZ: {
          scene: getComputedStyle(scRoot).zIndex,
          card: getComputedStyle(screen).zIndex,
          cap: getComputedStyle(document.querySelector('.cap')).zIndex,
          mascot: getComputedStyle(document.querySelector('.m-zone')).zIndex,
        },
      };
    },

    /* ---------- one frame of the opening ----------
       node decides everything and this writes it down, which is the split every
       layer in this clip is built on. the scene fades are per element because
       two of them are up at once through a handover; everything else is one
       property on the root. */
    scene(o) {
      for (let k = 0; k < scenes.length; k++) {
        const v = o.o[k];
        scenes[k].style.opacity = v.toFixed(4);
        scenes[k].style.visibility = v > 0.001 ? 'visible' : 'hidden';
      }
      for (let i = 0; i < scFaces.length; i++) scFaces[i].style.opacity = o.faces[i] ? '1' : '0';
      scFlash.style.opacity = o.flash.toFixed(4);
      /* the noise burst is hidden rather than transparent when it is off: a
         turbulence filter at zero opacity is still a turbulence filter being
         evaluated on every frame of a forty seven second clip. */
      scNoise.style.visibility = o.noise > 0.002 ? 'visible' : 'hidden';
      scNoise.style.opacity = o.noise.toFixed(4);
      /* the six blocks of the report, each with its own drop and squash. */
      for (let i = 0; i < scBricks.length; i++) {
        const b = o.bricks[i] || { o: 0, y: 0, s: 1 };
        scBricks[i].style.opacity = b.o.toFixed(3);
        scBricks[i].style.transform = 'translate(0,' + b.y + 'px) scale(' + b.s + ')';
      }
      /* and the seven things on the board. */
      for (let i = 0; i < scMapNodes.length; i++) {
        const v = o.map[i] || 0;
        scMapNodes[i].style.opacity = (v > 0 ? 1 : 0).toFixed(0);
        scMapNodes[i].style.transform = 'scale(' + v.toFixed(4) + ')';
      }
      if (scMapCentre) {
        scMapCentre.style.opacity = (o.mapCentre > 0 ? 1 : 0).toFixed(0);
        scMapCentre.style.transform = 'scale(' + o.mapCentre.toFixed(4) + ')';
      }
      const s = scRoot.style;
      s.setProperty('--rp-x', o.rp.x.toFixed(2));
      s.setProperty('--rp-y', o.rp.y.toFixed(2));
      s.setProperty('--rp-r', o.rp.r.toFixed(3));
      s.setProperty('--tv-scan', o.scan.toFixed(4));
      for (let i = 0; i < o.bands.length; i++) {
        s.setProperty('--tv-t' + i, o.bands[i].t + '%');
        s.setProperty('--tv-b' + i, o.bands[i].b + '%');
        s.setProperty('--tv-x' + i, String(o.bands[i].x));
      }
      s.setProperty('--sc-dx', o.dx.toFixed(2));
      s.setProperty('--sc-dy', o.dy.toFixed(2));
      s.setProperty('--sc-f', o.tube.toFixed(4));
      s.setProperty('--sc-w', o.words.toFixed(3));
      s.setProperty('--sc-ts', o.ts);
      s.setProperty('--sc-fl', o.fl);
      s.setProperty('--sc-fo', o.fo);
    },
    /* which scene is on screen and how much of it, read back off the rendered
       elements rather than off the numbers that were written. the whole point of
       a read back is that it can disagree. */
    sceneSeen() {
      const on = [];
      for (const el of scenes) {
        const op = parseFloat(getComputedStyle(el).opacity) || 0;
        if (op > 0.02) on.push({ key: el.dataset.key, o: +op.toFixed(3) });
      }
      const faces = scFaces.filter(e => (parseFloat(getComputedStyle(e).opacity) || 0) > 0.5).length;
      return { on, faces, split: +(scRoot.style.getPropertyValue('--sc-dx') || 0),
        flash: +(parseFloat(getComputedStyle(scFlash).opacity) || 0).toFixed(4),
        noise: +(parseFloat(getComputedStyle(scNoise).opacity) || 0).toFixed(4) };
    },
    /* the ink of whichever scenes are up, in the frame's own coordinates, so the
       safe area and the caption band are checked against letters rather than
       against the box the letters were laid out in. */
    sceneInk() {
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, n = 0;
      for (const el of scenes) {
        if ((parseFloat(getComputedStyle(el).opacity) || 0) <= 0.02) continue;
        const clip = el.dataset && el.dataset.clip ? scRoot.getBoundingClientRect() : null;
        for (const e of el.querySelectorAll('.sc-l, .sc-art, .sc-art svg, .sc-face, .sc-map svg')) {
          const cs = getComputedStyle(e);
          if (cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.02) continue;
          const r = e.getBoundingClientRect();
          if (!r.width || !r.height) continue;
          let a = r.left, b = r.top, c = r.right, d = r.bottom;
          if (clip) {
            a = Math.max(a, clip.left); b = Math.max(b, clip.top);
            c = Math.min(c, clip.right); d = Math.min(d, clip.bottom);
            if (c <= a || d <= b) continue;
          }
          n++;
          x0 = Math.min(x0, a); y0 = Math.min(y0, b);
          x1 = Math.max(x1, c); y1 = Math.max(y1, d);
        }
      }
      if (!n) return null;
      return { left: +x0.toFixed(1), top: +y0.toFixed(1), right: +x1.toFixed(1), bottom: +y1.toFixed(1) };
    },
    /* the camera. a point in the site's own css px, centred in the card at zoom
       z. the site's fixed top bar lives at the iframe's own top, so the clamp is
       on the visible top edge and the nav cannot enter the card at any framing. */
    cam(cx, cy, z) {
      /* ---------- nothing may scroll, in either document ----------
         the camera is a transform, so a scroll anywhere in the chain moves the
         picture without moving any of the numbers this file reads, and the
         framing silently stops meaning what it says.

         `overflow: hidden` stops a person scrolling and does not stop the
         browser. `element.focus()` scrolls the focused element into view in
         **every scrollable ancestor it has**, and an overflow-hidden box is a
         scroll container — so focusing a field inside the iframe scrolled the
         card in this document, across the frame boundary, by 251px. the send
         shot then resolved correctly, was written correctly, and rendered a
         quarter of a page lower than either of them said: the last thing the
         clip showed was an empty card with a button at the top of it. the
         window measurement is what caught it, because it reads the rendered
         boxes rather than the numbers that were written.

         so both are pinned here, every frame, next to the transform they would
         otherwise fight. */
      const w = this.win();
      if (w && (w.scrollY || w.scrollX)) w.scrollTo(0, 0);
      if (screen.scrollTop || screen.scrollLeft) { screen.scrollTop = 0; screen.scrollLeft = 0; }
      const tx = P.SCREEN.w / 2 - cx * z, ty = P.SCREEN.h / 2 - cy * z;
      site.style.transform = 'translate(' + tx.toFixed(3) + 'px,' + ty.toFixed(3) + 'px) '
        + 'scale(' + z.toFixed(5) + ')';
    },
    fade(v) { screen.style.opacity = v.toFixed(4); },
    end(v) { wm.style.opacity = v.toFixed(4); dom.style.opacity = v.toFixed(4); },
    ring(x, y, p) {
      if (p <= 0 || p >= 1) { tap.style.opacity = '0'; return; }
      tap.style.opacity = ((1 - p) * 0.9).toFixed(3);
      tap.style.transform = 'translate(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px) '
        + 'scale(' + (0.35 + p * 0.95).toFixed(3) + ')';
    },
    /* the bubble's face, decided by the string in it. see the css. */
    mono() {
      const t = (pill.textContent || '').trim();
      pill.dataset.mono = t && /[^\x20-\x7E]/.test(t) ? '1' : '';
      return pill.dataset.mono === '1';
    },

    /* ---------- reaching into the site ----------
       both documents are served from one origin, so the card can be measured and
       driven directly rather than through a second protocol. everything below is
       a read except `call`, and `call` only ever presses a control the page
       already has. */
    doc() { return site.contentDocument; },
    win() { return site.contentWindow; },
    /* an element's rect in the site's own css px, which is what a camera target
       is, and in the composed page's css px, which is where a tap goes. */
    rect(sel) {
      const d = this.doc();
      const e = d && d.querySelector(sel);
      if (!e) return null;
      const b = e.getBoundingClientRect();
      if (!b.width && !b.height) return null;
      const f = site.getBoundingClientRect();
      const z = f.width / P.SITE.w;
      return {
        page: { x: b.left, y: b.top, w: b.width, h: b.height,
          cx: b.left + b.width / 2, cy: b.top + b.height / 2 },
        screen: { x: f.left + b.left * z, y: f.top + b.top * z,
          w: b.width * z, h: b.height * z,
          cx: f.left + (b.left + b.width / 2) * z, cy: f.top + (b.top + b.height / 2) * z },
        z: z,
      };
    },
    /* where the card is looking, in the site's own px, so the two framing rules
       can be checked rather than trusted. */
    window_() {
      const f = site.getBoundingClientRect();
      const s = screen.getBoundingClientRect();
      const z = f.width / P.SITE.w;
      return {
        z: +z.toFixed(5),
        left: +((s.left - f.left) / z).toFixed(1), top: +((s.top - f.top) / z).toFixed(1),
        right: +((s.right - f.left) / z).toFixed(1), bottom: +((s.bottom - f.top) / z).toFixed(1),
      };
    },
    /* the nav, and it is a measurement rather than a promise: the bar is fixed
       to the iframe's own top, so this asks whether the card is looking at it. */
    navSeen() {
      const d = this.doc();
      const bar = d && d.querySelector('.bar');
      if (!bar) return null;
      const b = bar.getBoundingClientRect();
      const w = this.window_();
      return { bottom: +b.bottom.toFixed(1), top: +w.top.toFixed(1), seen: b.bottom > w.top + 0.5 };
    },
    /* the subline is the widest line the page sets. in the card and cut is the
       fault; out of the card is fine and is how the deep shots are framed. */
    clipCheck() {
      const d = this.doc();
      const el = d && (d.querySelector('.tag-live') || d.querySelector('.tag'));
      if (!el) return null;
      const b = el.getBoundingClientRect();
      const w = this.window_();
      const inCard = b.bottom > w.top && b.top < w.bottom;
      return {
        inCard,
        clipped: inCard && (b.left < w.left - 0.5 || b.right > w.right + 0.5),
        left: +b.left.toFixed(1), right: +b.right.toFixed(1),
        wLeft: w.left, wRight: w.right,
      };
    },
    /* is the site's own mascot alive. the eyes are centred by design — the page
       gates tracking on a media query the rig answers false to — so what has to
       be moving is the lid, and this reads it back off computed style rather
       than off what was written. */
    siteLid() {
      const d = this.doc();
      const e = d && d.querySelector('.m-eye');
      if (!e) return null;
      return parseFloat(getComputedStyle(e).getPropertyValue('--blink')) || 1;
    },
    /* everything the site has written on it, tested against the caption band.
       nothing the page draws may sit behind our words, and on this clip that is
       arithmetic — the card ends above the band — but it is checked because the
       card is what moves. */
    bandClash(top, bottom) {
      let n = 0, over = 0, what = null;
      const test = (r, name) => {
        if (!r) return;
        const o = Math.min(r.bottom, bottom) - Math.max(r.top, top);
        if (o > 0) { n++; if (o > over) { over = o; what = name; } }
      };
      if (getComputedStyle(screen).opacity >= 0.02) test(screen.getBoundingClientRect(), '.screen');
      /* the opening is in the same test as the card and for the same reason: it
         is the other thing that occupies the top of the frame, and the rule is
         about the band rather than about the card. */
      test(this.sceneInk(), '.sc-root');
      return { n, over: +over.toFixed(1), what };
    },
    /* the two controls the crop hides and the steps the film does off camera.
       every one of them is the page's own handler on the page's own element:
       nothing here writes into the site's state and nothing skips a step. */
    call(what) {
      const d = this.doc();
      if (!d) return 'no document';
      if (what.slice(0, 5) === 'lang:') {
        const b = d.querySelector('.lang[data-l="' + what.slice(5) + '"]');
        if (!b) return 'no button';
        b.click();
        return d.documentElement.getAttribute('lang');
      }
      if (what === 'next') {
        const b = d.querySelector('.nav .btn:not(.ghost)');
        if (!b) return 'no next';
        b.click();
        return 'next';
      }
      if (what.slice(0, 5) === 'pick:') {
        const n = Number(what.slice(5));
        const c = d.querySelector('.chips .chip:nth-child(' + n + ')');
        if (!c) return 'no chip';
        c.click();
        return 'picked ' + n;
      }
      if (what === 'glitch') {
        const cta = d.querySelector('.cta');
        if (!cta) return 'no cta';
        cta.classList.remove('shake');
        d.body.classList.remove('dm-noglitch');
        void cta.offsetWidth;
        cta.classList.add('shake');
        return 'shook';
      }
      /* any field of the last step, by the id index.html gives it. it was two
         named cases while only two fields were filled; the last step is narrated
         field by field now and a third and a fourth would have been two more
         copies of the same line. */
      if (what.slice(0, 6) === 'focus:') {
        const e = d.getElementById(what.slice(6));
        if (!e) return 'no field';
        e.focus();
        return what.slice(6);
      }
      if (what === 'blur') { if (d.activeElement && d.activeElement.blur) d.activeElement.blur(); return 'blurred'; }
      return 'unknown: ' + what;
    },
    /* what the form is showing, so the run can print the real step names rather
       than a list this file believes in. */
    step() {
      const d = this.doc();
      const q = d && d.querySelector('.pad .q');
      const dots = d ? d.querySelectorAll('.pad .pdot').length : 0;
      return { q: q ? q.textContent.trim() : null, dots,
        lang: d ? d.documentElement.getAttribute('lang') : null,
        sent: !!(d && d.querySelector('.pad .tick')),
        chips: d ? [...d.querySelectorAll('.chips .chip')]
          .map(c => c.getAttribute('aria-pressed') === 'true') : [] };
    },
    /* the typed line as the field actually holds it, and how tall its glyphs
       come out on the master. the brief asked whether it is legible at phone
       size and this is the number that answers it. */
    typedInk() {
      const d = this.doc();
      const ta = d && d.querySelector('.pad textarea');
      if (!ta) return null;
      const cs = getComputedStyle(ta);
      const f = site.getBoundingClientRect();
      const z = f.width / P.SITE.w;
      const cv = document.createElement('canvas').getContext('2d');
      cv.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
      const m = cv.measureText('H');
      const cap = m.actualBoundingBoxAscent || parseFloat(cs.fontSize) * 0.7;
      return { text: ta.value, capPx: +(cap * z * P.DSF).toFixed(1), font: cv.font };
    },
    /* ---------- can the caption face set cyrillic at all ----------
       `document.fonts.check(font, text)` is the obvious way to ask and it is the
       wrong one: it answers whether the faces needed for that text are *loaded*,
       and a browser that is going to fall back for a missing glyph still says
       yes. asked here it came back true for space grotesk, which ships latin and
       latin ext and no cyrillic at all.

       so it is measured instead. the same string is laid out in one family with
       **no fallback list**, and again in a family that does not exist, which is
       the browser's own default. two families that render a string at exactly
       the same width are not two renderings — it is the fallback both times.
       a latin control runs through the same test, because a method that cannot
       tell the two apart would say no to everything. */
    cyrillic(text) {
      const cv = document.createElement('canvas').getContext('2d');
      const w = (fam, s) => { cv.font = '500 100px ' + fam; return +cv.measureText(s).width.toFixed(2); };
      const NONE = '__no_such_family__';
      const MONO = 'ui-monospace, "Cascadia Mono", Consolas, monospace';
      const control = { sg: w('"Space Grotesk"', 'hey'), none: w(NONE, 'hey') };
      const cyr = { sg: w('"Space Grotesk"', text), none: w(NONE, text), mono: w(MONO, text) };
      return {
        family: getComputedStyle(pill).fontFamily,
        control, cyr,
        /* the control has to differ or the test proves nothing. */
        methodWorks: control.sg !== control.none,
        setsCyrillic: cyr.sg !== cyr.none,
        monoDiffers: cyr.mono !== cyr.none,
        note: cyr.sg !== cyr.none
          ? 'space grotesk sets it' : 'space grotesk falls back for it',
      };
    },
    /* ---------- can any of it be read on this theme ----------
       the three things that carry the clip on either page are the caption ink,
       the card's own hairline and the bubble's outline, and all three are a thin
       or a small thing against a flat ground. so they are **measured off the
       computed style** rather than trusted to a token: the contrast ratio is
       wcag's, computed here on the colours the browser actually resolved.

       a caption is large text by any definition at 44px, so 3.0 is the bar it
       has to clear and it clears it by a distance on both themes. the hairline
       and the outline are not text and wcag has no number for them: 3.0 is the
       non text contrast bar from the same spec and it is what they are held to.
       the run prints all of it and the review looks at it. */
    contrast() {
      const px = c => {
        const m = String(c).match(/[\d.]+/g).map(Number);
        return m.slice(0, 3);
      };
      const lin = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      const L = c => { const [r, g, b] = px(c); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); };
      const ratio = (a, b) => {
        const x = L(a), y = L(b);
        return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2);
      };
      const root = getComputedStyle(document.documentElement);
      const bg = getComputedStyle(document.body).backgroundColor;
      const cell = document.querySelector('.cap-w') || document.querySelector('.cap-in');
      const out = {
        theme: document.documentElement.getAttribute('data-theme'),
        bg,
        caption: { ink: cell ? getComputedStyle(cell).color : root.getPropertyValue('--fg').trim() },
        hairline: { ink: getComputedStyle(screen).borderTopColor },
        bubble: { ink: getComputedStyle(pill).borderTopColor, fill: getComputedStyle(pill).backgroundColor },
        endcard: { ink: getComputedStyle(wm).color, sub: getComputedStyle(dom).color },
        ring: { ink: getComputedStyle(document.getElementById('tap')).borderTopColor },
        /* the opening's own two: the type, which is --fg like everything else
           this file writes, and the orange, which is the one colour in the clip
           that is neither ink nor paper and is therefore the one worth measuring
           on both themes. */
        scene: { ink: getComputedStyle(document.querySelector('.sc-l')).color },
        orange: { ink: getComputedStyle(document.querySelector('.sc-plate')).fill },
      };
      out.scene.ratio = ratio(out.scene.ink, bg);
      out.orange.ratio = ratio(out.orange.ink, bg);
      out.caption.ratio = ratio(out.caption.ink, bg);
      out.hairline.ratio = ratio(out.hairline.ink, bg);
      /* the outline is drawn against the pill's own fill, not against the page:
         the pill is a filled capsule and the stroke sits on its edge, so the
         honest comparison is stroke against fill and fill against page. */
      out.bubble.ratio = ratio(out.bubble.ink, out.bubble.fill);
      out.bubble.onPage = ratio(out.bubble.fill, bg);
      out.endcard.ratio = ratio(out.endcard.ink, bg);
      out.endcard.subRatio = ratio(out.endcard.sub, bg);
      out.ring.ratio = ratio(out.ring.ink, bg);
      return out;
    },
    /* the safe area of everything we draw, against the drawn ink rather than
       against the box anything was told to draw in. the caption's own check does
       the words; the card, the end card and the tap ring are added here. the
       mascot is not in it — it is measured off its own geometry in node, because
       a browser rect for a rotated plate is the box of its geometry. */
    safe() {
      const out = { ...window.__cap.safe(P.VW, P.VH) };
      const add = (el, name) => {
        if (!el) return;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.02) return;
        const b = el.getBoundingClientRect();
        if (!b.width || !b.height) return;
        const d = { left: b.left, top: b.top, right: P.VW - b.right, bottom: P.VH - b.bottom };
        if (Math.min(d.left, d.top, d.right, d.bottom)
          < Math.min(out.left, out.top, out.right, out.bottom)) out.worst = name;
        out.left = Math.min(out.left, d.left); out.top = Math.min(out.top, d.top);
        out.right = Math.min(out.right, d.right); out.bottom = Math.min(out.bottom, d.bottom);
      };
      add(screen, '.screen');
      add(wm, '#end-wm');
      add(dom, '#end-dom');
      /* the flash is a box with a transparent edge, so what it can reach is its
         own border box and that is what is measured. it never moves. */
      add(scFlash, '#sc-flash');
      /* the opening, measured as ink. it draws inside the card's own rectangle,
         so it clears the borders by construction — and it jitters, and the
         report grows a fifth on its way in, so it is checked rather than left to
         the construction. */
      const ink = this.sceneInk();
      if (ink) {
        const d = { left: ink.left, top: ink.top, right: P.VW - ink.right, bottom: P.VH - ink.bottom };
        if (Math.min(d.left, d.top, d.right, d.bottom)
          < Math.min(out.left, out.top, out.right, out.bottom)) out.worst = '.sc-root';
        out.left = Math.min(out.left, d.left); out.top = Math.min(out.top, d.top);
        out.right = Math.min(out.right, d.right); out.bottom = Math.min(out.bottom, d.bottom);
      }
      return out;
    },
    /* the tallest caption card there is, grown by the biggest scale the entrance
       reaches, which is the ceiling the card has to clear. measured once, off
       the fitted cards, because it is the fitted size that decides it. */
    capCeiling() {
      let tallest = 0;
      for (const el of document.querySelectorAll('.cap-float, .cap-card')) {
        tallest = Math.max(tallest, el.getBoundingClientRect().height);
      }
      const bottom = P.CAP_BOX.y + P.CAP_BOX.h;
      return { tallest: +tallest.toFixed(1), top: +(bottom - tallest * 1.125).toFixed(1), bottom };
    },
    accent() {
      const p = document.createElement('span');
      p.style.cssText = 'position:absolute;left:-999px;color:var(--accent)';
      document.body.appendChild(p);
      const c = getComputedStyle(p).color;
      p.remove();
      return c;
    },
    /* one flush per capture, in both documents. the composed page animates
       nothing by hand, and the shim is installed and flushed here anyway so the
       layer runs under the same clock every clip in demo/ runs under. the site
       does animate by hand — the blink, the decode, the typing, the glitch — and
       it is the one that has to be right. */
    tick(now) {
      let n = 0;
      if (window.__dmRaf) n += window.__dmRaf(now);
      const w = this.win();
      if (w && w.__dmRaf) n += w.__dmRaf(now);
      return n;
    },
  };
}

/* ---------- what goes into both documents, before any page script ----------
   one function, because puppeteer installs it in every frame. what it does in
   the composed page is the prng and the shim; what it does in the site is that
   plus the four things a film needs from a live page and index.html is not
   edited for any of them. */
function injected() {
  let seed = window.top === window ? 0x2f6a41b3 : 0x7c19d5a1;
  Math.random = function () {
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; seed |= 0;
    return (seed >>> 0) / 4294967296;
  };
  const rafQ = [];
  let rafId = 1;
  window.requestAnimationFrame = function (cb) { rafQ.push({ id: rafId, cb: cb }); return rafId++; };
  window.cancelAnimationFrame = function (id) {
    const k = rafQ.findIndex(function (e) { return e.id === id; });
    if (k > -1) rafQ.splice(k, 1);
  };
  window.__dmRaf = function (now) {
    const batch = rafQ.splice(0, rafQ.length);
    for (const e of batch) { try { e.cb(now); } catch (err) { } }
    return rafQ.length;
  };
  if (window.top === window) return;

  /* ---- from here down it is the site ---- */
  try {
    localStorage.setItem('bt-lang', 'en');
    /* the site's own key, written before its own script reads it. the film does
       not restyle index.html for the dark variant: it sets the toggle a visitor
       would have set and lets the page come up in the mode it already has. */
    localStorage.setItem('bt-theme', window.__DM_THEME || 'light');
  } catch (e) { /* private mode, the page copes on its own */ }

  /* the page gates pointer tracking on this one query and also snaps --ex/--ey
     to zero the instant the form opens. answering false switches the tracking
     off at the source, so the eyes are centred and the blink is what is alive —
     which is what the brief asked the captured mascot to be. every other query
     is passed through, so hover, the cta filling and the theme all still work. */
  const realMM = window.matchMedia.bind(window);
  window.matchMedia = function (q) {
    if (q === '(hover: hover) and (pointer: fine)') {
      return { matches: false, media: q, onchange: null,
        addEventListener() { }, removeEventListener() { },
        addListener() { }, removeListener() { }, dispatchEvent() { return false; } };
    }
    return realMM(q);
  };

  /* NOTHING leaves this browser. the send at the end is real as far as the page
     is concerned and goes nowhere, and the run counts the two posts. */
  const realFetch = window.fetch;
  window.fetch = function (url) {
    const u = String(url && url.url ? url.url : url);
    if (/web3forms|workers\.dev|theboringtek/.test(u)) {
      window.__dmPosts = (window.__dmPosts || 0) + 1;
      return new Promise(res => setTimeout(() => res(new Response('{"success":true}', {
        status: 200, headers: { 'Content-Type': 'application/json' },
      })), 480));
    }
    return realFetch.apply(this, arguments);
  };

  document.addEventListener('DOMContentLoaded', function () {
    const css = document.createElement('style');
    css.textContent = [
      /* the camera is a transform on the iframe element, so the page inside it
         must never scroll: a scroll would move the content under a camera that
         thinks it knows where everything is. */
      'html,body{overflow:hidden !important}',
      /* the glitch is frozen and fired once, on the frame this film chooses. the
         page schedules its own every three to five seconds off Math.random, and
         a clip cannot have the button shaking whenever it feels like it. */
      'body.dm-noglitch .cta.shake{animation:none !important}',
      'body.dm-noglitch .cta.shake .cta-t{animation:none !important}',
      /* the site's own speech bubble is off, and it is the one thing on this
         list that is a taste call rather than a clock one. this film already has
         a mascot with a thought bubble in the corner; a second bubble inside the
         card is two characters talking over each other in one frame. the site's
         mascot still blinks, which is what it is in the shot for. */
      '.bubble{display:none !important}',
      /* ---- and everything below the hero is out of the film ----
         the brief is explicit: the crop is the hero card, and who we are and the
         honest part never appear. the crop already excludes them at every
         framing the camera is allowed, and this is what turns that from a thing
         the numbers happen to give into a thing that cannot happen — a form that
         grows a step taller than expected cannot bring a section into frame if
         the section is not laid out.

         it is a framing decision rather than an edit to the page: what is on
         screen is one shot of index.html, and a shot of the hero does not
         contain the sections under it. nothing about the hero, the form or the
         send is touched. */
      'section.below,footer.foot{display:none !important}',
    ].join('');
    document.head.appendChild(css);
    document.body.classList.add('dm-noglitch');
  }, true);
}

/* ---------- one server, both documents ----------
   the composed page at /stage and the repo root under everything else, so the
   site is same origin with the page that films it. index.html is served byte for
   byte as it is in git: nothing is rewritten on the way out. */
const MIME = {
  '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.xml': 'application/xml', '.txt': 'text/plain', '.ico': 'image/x-icon',
};
function serve(stageHtml) {
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/stage') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(stageHtml);
    }
    if (p.endsWith('/')) p += 'index.html';
    const f = path.resolve(ROOT, '.' + p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
      res.writeHead(404); return res.end('not here');
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(f)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise(r => srv.listen(0, '127.0.0.1', () => r({ srv, port: srv.address().port })));
}

function ff(args) { return execFileSync(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString(); }

function probe(file) {
  let out = '';
  try { execFileSync(ffmpeg, ['-hide_banner', '-i', file], { stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { out = (e.stderr || '').toString(); }
  const dur = out.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
  const res = out.match(/,\s*(\d{2,5})x(\d{2,5})[\s,]/);
  const fps = out.match(/([\d.]+)\s*fps/);
  const br = out.match(/bitrate:\s*(\d+)\s*kb\/s/);
  return {
    seconds: dur ? (+dur[1] * 3600 + +dur[2] * 60 + parseFloat(dur[3])) : null,
    w: res ? +res[1] : null, h: res ? +res[2] : null,
    fps: fps ? parseFloat(fps[1]) : null,
    kbps: br ? +br[1] : null,
    audio: /Audio:\s*aac/.test(out),
  };
}

function blend(N) {
  console.log('  blending ' + N * SUB + ' subframes into ' + N + ' frames ...');
  ff(['-y', '-hide_banner', '-loglevel', 'error',
    '-framerate', String(FPS * SUB), '-i', path.join(SUBS, 's%06d.jpg'),
    '-vf', 'tmix=frames=' + SUB + ',trim=start_frame=' + (SUB - 1)
      + ',setpts=PTS-STARTPTS,framestep=' + SUB,
    '-q:v', '2', path.join(FRAMES, 'f%06d.jpg')]);
}

function encode(audioFile) {
  const args = ['-y', '-hide_banner', '-loglevel', 'error',
    '-framerate', String(FPS), '-i', path.join(FRAMES, 'f%06d.jpg')];
  if (audioFile) args.push('-i', audioFile);
  /* crf 17 and the reason is the frame: this is ink on a white page with one
     screen recording in the middle of it, which is the cheapest thing this
     pipeline encodes. post10 is 22 because post10 is film grain over black. */
  args.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p',
    '-r', String(FPS));
  if (audioFile) args.push('-c:a', 'aac', '-b:a', '192k', '-shortest');
  args.push('-movflags', '+faststart', MP4);
  ff(args);
  return MP4;
}

/* ---------- go ---------- */
async function main() {
  console.log('the boring tek — post11, the explainer');
  fs.mkdirSync(OUT, { recursive: true });

  /* ---- the comedy line, first, because the clip is cut to it ----
     the hole the typing lives in is not a number in the script: it is however
     long this take turns out to be, plus the room the last two steps of the form
     need after it. so it is measured off the take's own waveform before a single
     other beat is placed. */
  const joke = await jokeTake();
  const jokePcm = decode(ffmpeg, joke.file);
  const jokeEdge = audioEdges(jokePcm);
  const jokeDur = +(jokeEdge.end - jokeEdge.start).toFixed(3);
  LINES[TYPE_LINE].gap = +(TYPE_LEAD + jokeDur + TYPE_TAIL).toFixed(3);
  console.log('  the comedy line: ' + joke.voice + ' (' + joke.voiceId + ') at '
    + joke.rate + '/' + joke.pitch + ', ' + jokeDur.toFixed(2) + 's of sound'
    + (joke.cached ? ', cached' : '') + ' — "' + TYPED + '"');
  console.log('    so line ' + (TYPE_LINE + 1) + ' carries a '
    + LINES[TYPE_LINE].gap.toFixed(2) + 's hole: ' + TYPE_LEAD.toFixed(2)
    + 's before the first key, the read and the hand together, then '
    + TYPE_TAIL.toFixed(2) + 's for the last two steps and the move onto send');

  /* ---- the voice ---- */
  const takes = [];
  for (let i = 0; i < LINES.length; i++) takes.push(await take(i));
  const v = buildVoice(takes);
  const SECONDS = v.seconds;
  console.log('  voice: ' + takes.length + ' takes, '
    + takes.filter(t => t.cached).length + ' cached, ' + v.words.length + ' words, '
    + SECONDS.toFixed(2) + 's with a ' + TAIL.toFixed(2) + 's tail');
  for (const b of v.beats) {
    console.log('    ' + String(b.i + 1).padStart(2) + '  ' + b.start.toFixed(2) + '..'
      + b.end.toFixed(2) + '  ' + b.wps.toFixed(2) + ' w/s  ' + b.rate + '/' + b.pitch
      + '  ' + b.screen.padEnd(5) + '  ' + b.text);
  }
  const wpsAll = v.beats.map(b => b.wps);
  console.log('    delivery spans ' + Math.min(...wpsAll).toFixed(2) + ' to '
    + Math.max(...wpsAll).toFixed(2) + ' words a second against a flat 2.3, and the '
    + 'gaps run ' + Math.min(...v.gaps).toFixed(2) + ' to ' + Math.max(...v.gaps).toFixed(2) + 's');

  /* ---- the captions ----
     float, which is the style built for footage: space grotesk 700, lowercase,
     one short card at a time, no card behind it and no fill of any kind. the ink
     is --fg and only --fg and there is no accent in this clip at all, so `flash`
     is off and a guard fails the render if the accent is ever painted. cards may
     break on a comma as well as on a sentence end, which is what stops
     "some know exactly, but have no time" cutting a card that was never a
     phrase. */
  const cut = markLines(v.beats);
  for (const x of cut.exceptions) {
    console.log('  spoken and drawn come apart once: line ' + x.line + ' says "'
      + x.say.join(' ') + '" and draws "' + x.draw + '", '
      + (x.hits === 1 ? 'matched at ' + x.at + 's' : x.hits + ' matches')
      + ' — ' + x.why);
  }
  const cap = planCaptions(cut.words, {
    style: 'float', perCard: 3, floatSize: 44,
    cardBreak: /[.!?,;:]["')\]]?$/,
    lead: 0.10, hold: 0.28,
    /* wider than the engine's 0.28, and it came off a rendered frame rather than
       out of a preference. every word kicks as it is said, and a kick grows the
       word about its own centre — so a long word being spoken next to a short
       one eats the gap on its left and `ai for business` read as `ai forbusiness`
       at 44px. the fit divides by this same number, so opening it costs a little
       type size rather than overflowing the box. */
    bodyGap: 0.36,
  });
  console.log(describe(cap));
  console.log('  ' + cut.marked.length + ' line ends were marked so no card straddles two of them, '
    + 'and the marks are stripped before a card is drawn');

  /* ---- the site, the mascot, the cut ---- */
  const site = planSite(v.beats, jokeDur);
  console.log('  the last step is filled field by field, on the word that names it:');
  for (const c of site.cues.filter(c => c.fill)) {
    console.log('    ' + c.t.toFixed(2) + 's  ' + c.fill.id.padEnd(10) + '"' + c.fill.text + '"   ' + c.note);
  }
  /* ---- the opening ----
     handed the card's own fade-in record rather than a copy of its numbers, so
     the last scene's exit and the card's entrance are the same object's t0 and
     t1 and cannot come apart. */
  const sc = planScenes(v.beats, site.fades.find(f => f.to === 1));
  console.log('  the opening: four scenes in the card box, one per line, '
    + sc.xf.toFixed(2) + 's handover windows taken off the card\'s own arrival, with a '
    + SC_CROSS.toFixed(2) + 's exchange at ' + (SC_CROSS_AT * 100).toFixed(0) + '% of each');
  for (const s of sc.scenes) {
    console.log('    ' + (s.k + 1) + '  ' + s.in.t0.toFixed(2) + '..' + s.out.t1.toFixed(2)
      + '  up ' + s.crossIn.t0.toFixed(2) + '..' + s.crossIn.t1.toFixed(2)
      + ', down ' + s.crossOut.t0.toFixed(2) + '..' + s.crossOut.t1.toFixed(2)
      + '  ' + String(s.bursts.length).padStart(2) + ' bursts'
      + (s.faces.length ? ', ' + s.faces.length + ' faces on '
        + s.faces.reduce((a, w) => a + w.length, 0) + ' windows' : '')
      + (s.dips.length ? ', ' + s.dips.length + ' tube dips' : '')
      + (s.wordsAt != null ? ', the words glitch in at ' + s.wordsAt.toFixed(2) + 's on "' + s.wordsOn + '"' : '')
      + '   ' + s.lines.map(l => l.t.toUpperCase()).join(' / '));
  }
  console.log('    the last handover window is ' + sc.cardFade.t0.toFixed(2) + '..'
    + sc.cardFade.t1.toFixed(2) + ', which is the card\'s own arrival record, and the type '
    + 'goes over ' + sc.scenes[3].crossOut.t0.toFixed(2) + '..'
    + sc.scenes[3].crossOut.t1.toFixed(2) + ' inside it, so there is no blank frame');

  console.log('  the days land on the word "' + sc.days.word + '" at ' + sc.days.at.toFixed(2)
    + 's, torn into ' + SC_DAYS.bands + ' bands: ' + (SC_TV.hard * 1000).toFixed(0)
    + 'ms hard, then a ' + (SC_TV.tail * 1000).toFixed(0) + 'ms stutter, and gone by '
    + sc.days.out.t1.toFixed(2));
  console.log('    the fault: tear ' + SC_TV.tear + 'px, split ' + SC_TV.split + 'px, jitter '
    + SC_TV.jitter + 'px, noise ' + SC_TV.noise + ', scanlines ' + SC_TV.scan
    + ', and one white frame peaking at ' + sc.days.flash.to.toFixed(2) + ' on the ' + THEME + ' page');
  console.log('  the report slides in from ' + sc.report.slide.t0.toFixed(2) + ', lands on "'
    + sc.report.word + '" at ' + sc.report.land.toFixed(2) + ' and builds in six blocks:');
  console.log('    the page rides the slide, then five blocks at '
    + sc.report.bricks.slice(1).map(b => b.t0.toFixed(2)).join(', ')
    + '  (' + (SC_REPORT.brick * 1000).toFixed(0) + 'ms apart, '
    + (SC_REPORT.fall * 1000).toFixed(0) + 'ms each), held to ' + sc.report.out.t0.toFixed(2)
    + ' and gone by ' + sc.report.out.t1.toFixed(2));
  console.log('  the chalkboard: "' + SC_MAP.centre + '" at ' + sc.map.centreAt.toFixed(2)
    + 's, then six nodes, up to ' + sc.map.off.toFixed(2));
  for (const n of sc.map.nodes) {
    console.log('    ' + n.key.padEnd(8) + ' pops at ' + n.on.toFixed(2) + 's  '
      + (n.word ? 'on the spoken word "' + n.word + '"' : 'in the gap, ' + n.gap.toFixed(2)
        + ' of the way between the words either side of it'));
  }
  console.log('    the board clears at ' + sc.map.off.toFixed(2)
    + ' and the end card starts arriving at ' + sc.endIn.toFixed(2));

  const marks = planMarks(v.beats, site);
  const mas = planMascot({
    seconds: SECONDS, marks, theme: THEME, pos: 'bottom-left',
    band: { x: CAP_BOX.x, y: CAP_BOX.y, w: CAP_BOX.w, h: CAP_BOX.h },
    seed: 0x11a70b,
  });
  console.log(describeMascot(mas));
  const rep = mascotMotion(mas, FPS, SECONDS);
  const rep60 = FPS === 60 ? rep : mascotMotion(mas, 60, SECONDS);
  console.log(describeMotion(rep));

  console.log('  the hand: ' + site.typing.keys.length + ' keystrokes over '
    + (site.typing.to - site.typing.from).toFixed(2) + 's, gaps '
    + (Math.min(...site.typing.gaps) * 1000).toFixed(0) + ' to '
    + (Math.max(...site.typing.gaps) * 1000).toFixed(0) + 'ms, a typo at '
    + site.typing.typoAt + ' and a hesitation at ' + site.typing.hesitateAt);

  /* ---- the sound ----
     no music in this pass. what is in the file besides the read is the mascot's
     own two cues — a pop when a bubble arrives and a ding on the agreement beat,
     which is the module's whole sound surface — a click on each tap, a `key`
     tick per group of characters under the typing, a `press` on the send, and a
     `ding` on the frame the check mark is drawn.

     the three that are new are the three things the clip did silently: the hand
     typed with nothing under it, the send sounded like every other tap, and the
     confirmation the whole ending is built around arrived without a sound. none
     of them is a file — `key` and `press` are two more recipes in
     `lib/sfx.mjs`, and `ding` is the one that was already written as "a check
     being drawn" and had only ever been used for an agreement.

     every one of them is derived from a plan that already existed rather than
     typed against the picture, so changing a word in the script moves the voice,
     the captions, the camera, the mascot and the sounds together. */
  /* the report and the offering bring three more, and all three are recipes
     `lib/sfx.mjs` already carries — nothing was added to that module and no file
     was loaded. the whoosh is the page falling and it is placed so its own hump
     peaks just before the contact rather than on it; the popDeep is the contact,
     on the frame the flash peaks; and a pop lands on each of the five offering
     shapes, because five visual events with nothing under them would be the only
     silent events in the clip. */
  const cues = mascotCues(mas)
    .concat(site.rings.map(r => ({ t: r.t, kind: r.kind })))
    .concat(site.keys.map(t => ({ t, kind: 'key' })))
    .concat([{ t: site.confirmAt, kind: 'ding' }])
    /* the page coming in from the side, and the check mark landing on it. the
       four bars in between get nothing: six sounds inside half a second is a
       drum fill, and this is a document being assembled. */
    .concat([
      { t: sc.report.slide.t0, kind: 'whoosh', opts: { len: 0.30 } },
      { t: sc.report.bricks[5].t0, kind: 'popDeep' },
    ]);
  const sfx = renderSfx(cues, SECONDS, { gains: { popDeep: SC_IMPACT_DB } });
  /* and the two this file synthesises for itself: one fault on the frame the
     type tears, and a stick of chalk on each of the seven things that go up on
     the board. */
  addSfx(sfx, glitchSfx({ len: SC_TV.hard + 0.02 }), sc.days.at, SC_GLITCH_DB,
    'glitch', 'synthesised in post11');
  const chalkBuf = chalkSfx();
  addSfx(sfx, chalkBuf, sc.map.centreAt, SC_CHALK_DB, 'chalk', 'the centre');
  for (const n of sc.map.nodes) {
    addSfx(sfx, chalkBuf, n.on, SC_CHALK_DB, 'chalk', n.key);
  }
  console.log('  sound: ' + cues.length + ' cues — '
    + Object.entries(cues.reduce((a, c) => (a[c.kind] = (a[c.kind] || 0) + 1, a), {}))
      .map(([k, n]) => n + ' ' + k).join(', ') + ', and no music');

  /* ---------- where the clip is quiet ----------
     every hole in the read, measured on the waveform, so the one place with no
     voice and no caption over it is a number rather than something a viewer
     notices for us. the typing hole is the only one allowed to be long, and it
     is not silent: a comedy read runs over it and the keyboard runs under that. */
  const quiet = [];
  for (let i = 1; i < v.beats.length; i++) {
    const from = v.beats[i - 1].sound.end, to = v.beats[i].sound.start;
    if (to - from > 0.60) quiet.push({ i, from: +from.toFixed(2), to: +to.toFixed(2), len: +(to - from).toFixed(2) });
  }
  console.log('  the holes over 0.60s in the read, and what is in each of them:');
  for (const q of quiet) {
    const what = q.from <= site.typing.from && q.to >= site.typing.to
      ? 'the hand types in it, under the comedy read'
      : q.from <= site.sendAt && q.to >= site.sendAt ? 'the send is pressed in it'
        : q.from <= site.confirmAt && q.to >= site.confirmAt ? 'the check mark is drawn in it'
          : 'the tick is held and the card leaves';
    console.log('    ' + q.from.toFixed(2) + '..' + q.to.toFixed(2) + '  ' + q.len.toFixed(2) + 's  ' + what);
  }

  if (PLAN_ONLY) {
    console.log('\n  the cut');
    console.log('    ' + site.typing.from.toFixed(2) + '..' + site.typing.to.toFixed(2)
      + '  the hand and the comedy read, ' + site.keys.length + ' key ticks under '
      + site.typing.keys.length + ' keystrokes');
    for (const c of site.cues.filter(c => !c.key)) {
      console.log('    ' + c.t.toFixed(2).padStart(6) + 's  '
        + (c.tap ? 'tap  ' + c.tap
          : c.fill ? 'fill ' + c.fill.id + ' "' + c.fill.text + '"'
            : 'call ' + c.call) + '   ' + (c.note || ''));
    }
    for (const l of site.legs) {
      console.log('    ' + l.t0.toFixed(2).padStart(6) + '..' + l.t1.toFixed(2)
        + '  ' + l.ease.padEnd(6) + ' to ' + l.to.sel + ' @' + l.to.z + '   beat ' + l.beat);
    }
    for (const f of site.fades) {
      console.log('    ' + f.t0.toFixed(2).padStart(6) + '..' + f.t1.toFixed(2)
        + '  card -> ' + f.to);
    }
    console.log('\n  ' + SECONDS.toFixed(2) + 's, ' + Math.round(FPS * SECONDS)
      + ' frames at ' + FPS + 'fps. nothing was rendered.');
    return;
  }

  const N = Math.round(FPS * SECONDS);
  let state = null;
  if (ONLY_ENCODE) {
    state = JSON.parse(fs.readFileSync(STATE, 'utf8'));
  } else {
    state = await render(cap, mas, site, sc, v, N, SECONDS);
    fs.writeFileSync(STATE, JSON.stringify(state, null, 2));
  }

  /* ---- the mix ----
     the read on top, the small bus under it, ducked while a word is being
     spoken, then the loudness pass that keeps its best answer rather than its
     last one. both halves of that discipline were paid for by post5 and both are
     in the file above the loop. */
  /* the comedy read goes onto the voice track by hand rather than through
     buildVoice, because it is not one of the fourteen takes: it is not on the
     narrator's clock, it is not captioned, and it must never reach the plan that
     the drawn-is-spoken guard reads. it is laid so its first sound lands on the
     first keystroke, which is also its last sound landing on the last one — the
     window was cut to its length. a decibel and a half under the narrator, so it
     reads as somebody else thinking rather than as the film talking.

     its words **are** in the duck envelope. the keyboard ticks have to go under
     it exactly as they go under a narrated line, and an envelope built from the
     fourteen takes alone would not know this line is being said at all. */
  const jokeOff = +(site.typing.from - jokeEdge.start).toFixed(4);
  const jokeWords = joke.words.map(w => ({
    word: w.word, start: +(w.start + jokeOff).toFixed(4), end: +(w.end + jokeOff).toFixed(4),
  }));
  const jokeAt = layIn(v.track, jokePcm, jokeEdge, jokeOff, Math.pow(10, JOKE.trimDb / 20));
  const env = voiceEnvelope(v.words.concat(jokeWords), SECONDS);
  const mix = mixdown(v.track, sfx.buf, env, { duck: DUCK, voiceGain: VOICE_TRIM });
  const under = checkUnderVoice(mix.voiceOut, mix.bus);
  const baseMix = mix.out.slice();
  const passes = [];
  const miss = q => Math.abs(q - TARGET_LUFS);
  let lift = 0, ceiling = PEAK_CEILING, best = null;
  for (let i = 0; i < 12; i++) {
    mix.out.set(baseMix);
    if (lift) applyGain(mix.out, lift);
    const l = limit(mix.out, ceiling);
    writeWav(WAV, mix.out);
    const m = loudness(ffmpeg, WAV);
    const pass = { lift, ceiling, lufs: m.lufs, tp: m.truePeak, gr: l.reduction };
    passes.push(pass);
    if (!m.ok) { best = pass; break; }
    if (m.truePeak != null && m.truePeak > PEAK_CEILING) {
      ceiling = +(ceiling - (m.truePeak - PEAK_CEILING) - 0.05).toFixed(2);
      continue;
    }
    if (best && miss(m.lufs) >= miss(best.lufs) - 0.05) break;
    best = pass;
    if (miss(m.lufs) <= 0.3) break;
    lift = +(lift + TARGET_LUFS - m.lufs).toFixed(2);
  }
  if (!best) best = passes[passes.length - 1];
  mix.out.set(baseMix);
  if (best.lift) applyGain(mix.out, best.lift);
  const lim = limit(mix.out, best.ceiling);
  writeWav(WAV, mix.out);
  const after = loudness(ffmpeg, WAV);

  const file = encode(WAV);
  const p = probe(file);

  const joked = { ...joke, dur: jokeDur, at: jokeAt, words: jokeWords };
  report(state, v, cut, cap, mas, rep60, site, cues, sfx, mix, under, after, lim, best, passes, p, SECONDS, joked, sc);
  const fail = guard(state, v, cut, cap, mas, rep60, site, cues, mix, under, after, lim, p, SECONDS, joked, sc);

  if (!KEEP && !ONLY_ENCODE) {
    fs.rmSync(FRAMES, { recursive: true, force: true });
    fs.rmSync(SUBS, { recursive: true, force: true });
  }
  if (fail.length) { console.error(['', 'FAILED', ...fail].join('\n  ')); process.exit(1); }
  console.log('\nall checks passed.');
}

/* ---------- the render ---------- */
async function render(cap, mas, site, sc, v, N, SECONDS) {
  if (!CHROME) throw new Error('no chrome found — add its path to CHROME at the top of this file');
  for (const d of [FRAMES, SUBS, VERIFY]) {
    fs.rmSync(d, { recursive: true, force: true });
    fs.mkdirSync(d, { recursive: true });
  }

  const html = sceneHtml(cap, CAP_BOX, mas);
  const { srv, port } = await serve(html);
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--hide-scrollbars', '--disable-lcd-text', '--font-render-hinting=none',
      '--force-color-profile=srgb', '--disable-dev-shm-usage', '--mute-audio'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: VW, height: VH, deviceScaleFactor: DSF });
  /* the theme reaches both documents before either page script runs, which is
     the only way the site can come up already dark rather than flipping into it
     on a frame somebody would see. */
  await page.evaluateOnNewDocument(t => { window.__DM_THEME = t; }, THEME);
  await page.evaluateOnNewDocument(injected);
  const cdp = await page.createCDPSession();
  await cdp.send('Emulation.setEmulatedMedia', {
    features: [
      { name: 'prefers-reduced-motion', value: 'no-preference' },
      { name: 'prefers-color-scheme', value: 'light' },
    ],
  });

  let expired = null;
  cdp.on('Emulation.virtualTimeBudgetExpired', () => { const f = expired; expired = null; if (f) f(); });
  const advance = async ms => {
    const q = new Promise(r => { expired = r; });
    await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pauseIfNetworkFetchesPending', budget: ms });
    await q;
  };

  await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pause' });
  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:' + port + '/stage' });

  /* what is missing rather than that something is, because a page that never
     comes up is otherwise a twenty minute render's worth of nothing. */
  const state0 = () => page.evaluate(() => {
    const d = window.__stage && window.__stage.doc();
    return {
      stage: !!window.__stage, built: !!window.__built,
      cap: !!(window.__cap && window.__cap.ready),
      mas: !!(window.__mas && window.__mas.ready),
      fonts: document.fonts.status,
      doc: !!d, cta: !!(d && d.querySelector('.cta')),
      siteFonts: d ? d.fonts.status : null,
    };
  }).catch(e => ({ error: String(e).slice(0, 120) }));

  let burned = 0, s = null;
  for (let i = 0; i < 400; i++) {
    s = await state0();
    if (s.built && s.cap && s.mas && s.cta && s.siteFonts === 'loaded') break;
    await advance(STEP); burned += STEP;
  }
  if (!(s.built && s.cap && s.mas && s.cta)) {
    throw new Error('the stage never became ready: ' + JSON.stringify(s));
  }
  /* offline everything renders in the mono fallback and looks almost right,
     which is the worst kind of wrong to judge type on. */
  const faces = await page.evaluate(() => ({
    michroma: document.fonts.check('400 40px Michroma'),
    grotesk7: document.fonts.check('700 40px "Space Grotesk"'),
    grotesk5: document.fonts.check('500 26px "Space Grotesk"'),
    siteMichroma: window.__stage.doc().fonts.check('400 40px Michroma'),
  }));
  for (const [k, ok] of Object.entries(faces)) {
    if (!ok) throw new Error(k + ' did not load — the type would be judged in the mono fallback');
  }
  console.log('    ready after ' + burned.toFixed(0) + 'ms of virtual time');

  /* the site gets its own opening move off camera. index.html decodes its
     wordmark over 1150ms and types its subline after it, and that is the page's
     entrance rather than this film's: the card fades in on a page that has
     already arrived, the way a phone looks when you have been holding it for a
     second. */
  const SETTLE = Math.round(4.0 * FPS);
  for (let i = 0; i < SETTLE; i++) {
    await page.evaluate(now => window.__stage.tick(now), (i + 1) * STEP);
    await advance(STEP);
  }
  console.log('    the site settled ' + (SETTLE / FPS).toFixed(2) + 's before frame zero');

  const built = await page.evaluate(() => window.__built);
  const ceiling = await page.evaluate(() => window.__stage.capCeiling());
  const accent = await page.evaluate(() => window.__stage.accent());
  console.log('    the caption ceiling is ' + ceiling.top + '..' + ceiling.bottom
    + ' css px, the card ends at ' + (SCREEN.y + SCREEN.h)
    + ', so there is ' + (ceiling.top - (SCREEN.y + SCREEN.h)).toFixed(1) + 'px between them');

  /* the cyrillic answer, measured before a frame is written rather than after a
     render. the pill is loaded with the greeting and asked what it can set. */
  const contrast = await page.evaluate(() => window.__stage.contrast());
  console.log('    contrast on the ' + contrast.theme + ' page, against ' + contrast.bg + ':');
  console.log('      caption ink       ' + contrast.caption.ratio.toFixed(2) + ':1   ' + contrast.caption.ink);
  console.log('      card hairline     ' + contrast.hairline.ratio.toFixed(2) + ':1   ' + contrast.hairline.ink);
  console.log('      bubble outline    ' + contrast.bubble.ratio.toFixed(2) + ':1 against its own fill, '
    + 'and the fill is ' + contrast.bubble.onPage.toFixed(2) + ':1 against the page');
  console.log('      end card wordmark ' + contrast.endcard.ratio.toFixed(2) + ':1, the address '
    + contrast.endcard.subRatio.toFixed(2) + ':1');
  console.log('      the tap ring      ' + contrast.ring.ratio.toFixed(2) + ':1');
  console.log('      the opening type  ' + contrast.scene.ratio.toFixed(2) + ':1   ' + contrast.scene.ink);
  console.log('      the orange faces  ' + contrast.orange.ratio.toFixed(2) + ':1   ' + contrast.orange.ink
    + ', the same colour on both themes');

  const cyr = await page.evaluate(() => {
    const el = document.getElementById('m-bubble-text');
    const before = el.textContent;
    el.textContent = 'привет';
    const r = window.__stage.cyrillic('привет');
    const mono = window.__stage.mono();
    const caps = window.__mas.caps();
    el.textContent = before;
    window.__stage.mono();
    return { ...r, mono, caps };
  });
  console.log('    cyrillic: ' + cyr.note + ' — "привет" measures ' + cyr.cyr.sg
    + 'px in space grotesk and ' + cyr.cyr.none + ' in the browser default, so the pill drops '
    + 'to the mono stack: ' + (cyr.mono ? 'applied' : 'NOT APPLIED')
    + ', which measures ' + cyr.cyr.mono + 'px and renders ' + cyr.caps.capPx + ' device px of cap');

  /* the head's clearance is computed off every frame rather than sampled, since
     the geometry is known and it costs nothing to do it properly. */
  let headWorst = null;
  for (let f = 0; f < N; f++) {
    const r = headRect(mas, mascotFrame(mas, f / FPS));
    const near = Math.min(r.left, r.top, r.right, r.bottom);
    if (!headWorst || near < headWorst.near) headWorst = { t: +(f / FPS).toFixed(2), near, ...r };
  }

  /* ---- the loop ---- */
  const fired = new Set();
  const taps = [], calls = [], fills = [], clipFaults = [], navFaults = [], camTrail = [], shots = [], framing = [];
  const camFaults = [];
  const safeSamples = [], bandHits = [], lidSeen = [];
  let safeWorst = null, sawAccent = false, capMoved = 0, prevSum = null, maxVisible = 0;
  let bubbleWorst = null, bubbleSamples = 0, masBandHits = 0;
  let cam = null, leg = null, legFrom = null, legTo = null;
  let fade = 0, fadeFrom = 0, activeFade = null;
  let tapAt = -99, tapPoint = { x: 0, y: 0 };
  let typedInk = null, steps = [], posts0 = 0, lidMoved = 0;
  const stills = v.beats.map(b => ({
    at: Math.min(b.start + 0.55, SECONDS - 0.05),
    name: String(b.i + 1).padStart(2, '0') + '-' + b.screen + '.png',
  }));
  const shotStill = new Set();
  let nextStill = 0;
  const wall = Date.now();

  posts0 = await page.evaluate(() => window.__stage.win().__dmPosts || 0);

  /* the opening shot, resolved before frame zero so the card has somewhere to be
     the moment it fades in. */
  const resolve = async sp => {
    const a = await page.evaluate(s => window.__stage.rect(s), sp.sel);
    if (!a) return null;
    /* a shot may name two elements, and then the subject is the box that holds
       both of them — the wordmark down to the button, say. it is measured live
       like everything else here, so it is the box the page is actually drawing
       rather than a coordinate this file believes in. */
    let r = a;
    if (sp.to) {
      const b = await page.evaluate(s => window.__stage.rect(s), sp.to);
      if (b) {
        const y0 = Math.min(a.page.y, b.page.y);
        const y1 = Math.max(a.page.y + a.page.h, b.page.y + b.page.h);
        const x0 = Math.min(a.page.x, b.page.x);
        const x1 = Math.max(a.page.x + a.page.w, b.page.x + b.page.w);
        r = { page: { x: x0, y: y0, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 } };
      }
    }
    /* a fit takes the deepest zoom that still holds the element whole, with the
       margin it asked for. it is measured live, so a shot on `.pad` frames the
       card the form is actually showing rather than the one it was showing when
       this file was written.

       **both axes**, and the first pass of this only did width. the lockup is
       328 css px across and about 390 tall, so fitting it on width alone framed
       it at 1.10 and cut the mascot's crown off the top of the card and the hint
       line off the bottom — a shot of the hero with the head cropped, which is
       the one thing a hero shot cannot be. a shot that wants the width only says
       so with `wide`. */
    let z = sp.z;
    if (sp.fit != null) {
      z = (SCREEN.w - 2 * sp.fit) / r.page.w;
      if (!sp.wide) z = Math.min(z, (SCREEN.h - 2 * sp.fit) / r.page.h);
      z = clampTo(z, 1.0, sp.maxZ || ZOOM_CAP);
    }
    /* the clamps, and all three are the page's rule rather than a preference.

       the crop may never show the iframe's own top, where the fixed bar lives.

       it may never run past the bottom of what the iframe rendered.

       and it may not be looking **through** the subline at a zoom that cuts it.
       the subline is the widest line index.html sets; a frame narrower than it,
       with it in shot, cuts its first and last letter, and a cropped THE BORING
       TEK reads as a rendering fault rather than as a crop. so at any zoom that
       cannot hold the subline whole, the frame is pushed down until the subline
       is above it — which is the same answer post9 reached and the reason the
       form shots are framed on the card rather than on the page. */
    const half = SCREEN.h / 2 / z;
    const nav = await page.evaluate(() => window.__stage.navSeen());
    const top = (nav ? nav.bottom : 60) + 6;
    const m = (sp.fit == null ? 10 : sp.fit) / z;
    let cy = sp.align === 'top' ? r.page.y - m + half
      : sp.align === 'bottom' ? r.page.y + r.page.h + m - half
        : r.page.cy;
    cy += sp.dy || 0;
    cy = Math.max(cy, top + half);
    const tag = await page.evaluate(() => window.__stage.rect('.tag-live')
      || window.__stage.rect('.tag'));
    let pushed = false;
    if (tag && tag.page.w > SCREEN.w / z + 0.5) {
      const want = tag.page.y + tag.page.h + 4 + half;
      if (want > cy) { cy = want; pushed = true; }
    }
    /* ---------- and no line of the page is cut in half ----------
       the h1 is THE BORING TEK, stacked in three lines at this width. a frame
       whose top edge lands inside it shows `BORING / TEK` with the first line
       gone, which is the brand name arriving as a fragment — the checklist's own
       item, and worse than the brand being absent. the subline under it is the
       same problem one size down: `BUILDING THE BORING PART OF THE FUTURE` with
       its top half sliced off reads as a broken render.

       so the frame is pushed down past whichever of them its top edge lands
       inside, and it is run twice because clearing the first can land inside the
       second. a shot of the form does not want half a wordmark over it, and this
       is what makes that true at any card height the form ends up with. */
    const cleared = [];
    for (let pass = 0; pass < 2; pass++) {
      for (const sel of ['.hero', '.tag', '.m-zone']) {
        const e = await page.evaluate(s => window.__stage.rect(s), sel);
        if (!e) continue;
        const top = cy - half, bottom = cy + half;
        const y0 = e.page.y, y1 = e.page.y + e.page.h;
        if (y0 < top - 0.5 && y1 > top + 0.5) { cy = y1 + 3 + half; cleared.push(sel); }
        else if (y0 < bottom - 0.5 && y1 > bottom + 0.5) {
          const up = Math.max(half, y0 - 3 - half);
          if (up < cy) { cy = up; cleared.push(sel + ' (below)'); }
        }
      }
    }
    cy = Math.min(cy, Math.max(SITE.h - half, half));
    return {
      cx: SITE.w / 2, cy, z, sel: sp.sel + (sp.to ? '..' + sp.to : ''),
      box: { y: +r.page.y.toFixed(1), w: +r.page.w.toFixed(1), h: +r.page.h.toFixed(1) },
      scroll: await page.evaluate(() => { const w = window.__stage.win(); return w ? [w.scrollX, w.scrollY] : null; }),
      shows: { w: +(SCREEN.w / z).toFixed(1), h: +(SCREEN.h / z).toFixed(1) },
      align: sp.align, pushed, cleared,
    };
  };
  cam = await resolve(site.legs[0].to) || { cx: SITE.w / 2, cy: 300, z: 1 };
  await page.evaluate(c => window.__stage.cam(c.cx, c.cy, c.z), cam);

  /* the opening's own frame, computed once per **output** frame and handed to
     every subframe of it unchanged. that is the whole reason it is out here and
     not inside the subframe loop: a two frame rgb split averaged with three
     clean captures is a smudge, and a glitch that smudges is not a glitch. */
  let scF = null, scOff = false;
  const scSeen = [], scInk = [], scLate = [], scBlank = [], scOnCard = [];
  const scDuty = sc.blocks.map(() => 0), scOn = sc.blocks.map(() => 0);
  let flashPeak = 0, flashAt = null, tore = 0, noised = 0;

  for (let f = 0; f < N; f++) {
    const t0 = f / FPS;
    /* the layer is live in two stretches with thirty seconds of nothing between
       them: the opening, and then the report and the offering after the site
       card has gone. it is written on every frame of both and put away once in
       the middle, rather than a call a frame for the half of the clip that is
       the site. */
    const live = t0 <= sc.until + 0.05
      || (t0 >= sc.days.flash.t0 - 0.10 && t0 <= sc.last + 0.10);
    if (live) {
      scF = sceneFrame(sc, f, FPS);
      scOff = false;
      /* the duty cycle, per block: how many of the frames a block is up for have
         a split on them. "never continuous" is this number, and the guard has a
         ceiling for it. */
      for (let j = 0; j < scF.o.length; j++) {
        if (scF.o[j] <= 0.02) continue;
        scOn[j]++;
        if (scF.split > 0.01) scDuty[j]++;
      }
      /* the flash, the tearing and the noise, as they were written rather than
         as they were intended. a channel that is planned and never rendered is
         the failure mode a plan cannot see. */
      if (scF.flash > flashPeak) { flashPeak = scF.flash; flashAt = +t0.toFixed(3); }
      if (scF.bands.some(b => Math.abs(b.x) > 0.5)) tore++;
      if (scF.noise > 0.01) noised++;
    } else if (!scOff) {
      /* one write that puts the layer away, rather than a call a frame for the
         stretch it has nothing in. */
      scF = sceneFrame(sc, Math.round((t0 + 0.5) * FPS), FPS);
      for (let j = 0; j < scF.o.length; j++) scF.o[j] = 0;
      scF.flash = 0; scF.noise = 0;
      scOff = true;
    } else scF = null;

    for (let k = 0; k < SUB; k++) {
      const idx = f * SUB + k;
      const t = f / FPS + k / (FPS * SUB);
      const first = k === 0;
      if (scF) await page.evaluate(o => window.__stage.scene(o), scF);

      /* --- the one shot actions --- */
      for (const c of site.cues) {
        if (fired.has(c) || c.t > t) continue;
        fired.add(c);
        if (c.tap) {
          const r = await page.evaluate(s => window.__stage.rect(s), c.tap);
          if (!r) { console.warn('    ! tap target missing: ' + c.tap + ' @' + t.toFixed(2) + 's'); continue; }
          const x = r.screen.cx, y = r.screen.cy;
          const inCard = x > SCREEN.x && x < SCREEN.x + SCREEN.w
            && y > SCREEN.y && y < SCREEN.y + SCREEN.h;
          taps.push({ t: +t.toFixed(3), sel: c.tap, note: c.note,
            at: { x: +x.toFixed(1), y: +y.toFixed(1) }, inCard });
          tapAt = t; tapPoint = { x, y };
          await page.mouse.click(x, y, { delay: 16 });
        } else if (c.key === 'Backspace') {
          await page.keyboard.press('Backspace');
        } else if (c.key !== undefined) {
          await page.keyboard.type(c.key, { delay: 0 });
        } else if (c.fill) {
          /* one field of the last step, on the word that names it, through the
             page's own focus and its own input listeners. nothing is written
             into the site's state and nothing skips a step. */
          const got = await page.evaluate(id => window.__stage.call('focus:' + id), c.fill.id);
          if (got === 'no field') {
            console.warn('    ! field missing: ' + c.fill.id + ' @' + t.toFixed(2) + 's');
          } else {
            await page.keyboard.type(c.fill.text, { delay: 0 });
          }
          fills.push({ t: +t.toFixed(3), id: c.fill.id, text: c.fill.text, got, note: c.note });
          calls.push({ t: +t.toFixed(3), what: 'fill ' + c.fill.id, got, note: c.note });
        } else if (c.call) {
          const got = await page.evaluate(w => window.__stage.call(w), c.call);
          calls.push({ t: +t.toFixed(3), what: c.call, got, note: c.note });
        }
      }

      /* --- the camera --- */
      let active = null;
      /* half a frame of tolerance: a leg that starts within half a frame of now
         has started. post9's frame zero fault was exactly this rounding, and it
         only appeared at sixty. */
      for (const l of site.legs) if (t >= l.t0 - 0.5 / FPS) active = l;
      if (active && leg !== active) {
        leg = active;
        legFrom = { ...cam };
        legTo = await resolve(active.to) || { ...cam };
        /* every leg records what its shot actually resolved to, so the run can
           print the framing rather than the intention: the zoom it got, how much
           of the page that shows, and which of the page's own lines the frame
           had to be moved clear of. */
        shots.push({ beat: active.beat || null, anchor: active.anchor || null,
          t: +active.t0.toFixed(2), ease: active.ease,
          z: +legTo.z.toFixed(3), cy: +legTo.cy.toFixed(1), ...legTo,
          cx: undefined });
      }
      if (active) {
        const p = clampTo((t - active.t0) / Math.max(active.t1 - active.t0, 1e-6), 0, 1);
        const e = EASES[active.ease](p);
        cam = { cx: lerp(legFrom.cx, legTo.cx, e), cy: lerp(legFrom.cy, legTo.cy, e),
          z: lerp(legFrom.z, legTo.z, e), sel: legTo.sel };
      }
      await page.evaluate(c => window.__stage.cam(c.cx, c.cy, c.z), cam);
      if (first) camTrail.push({ t: +t.toFixed(2), z: +cam.z.toFixed(4), cy: +cam.cy.toFixed(1) });

      /* --- the card's own opacity ---
         the last fade that has started is the one running, and the value it
         starts from is wherever the card was on the frame it started. taking
         `from` at the moment the fade becomes active rather than at plan time is
         what lets a fade out interrupt a fade in without a step. */
      let fd = null;
      for (const q of site.fades) if (t >= q.t0) fd = q;
      if (fd) {
        if (activeFade !== fd) { activeFade = fd; fadeFrom = fade; }
        fade = lerp(fadeFrom, fd.to, GLIDE(clampTo((t - fd.t0) / Math.max(fd.t1 - fd.t0, 1e-6), 0, 1)));
      }
      await page.evaluate(x => window.__stage.fade(x), fade);

      /* --- the end card --- */
      const endIn = v.beats[LINES.length - 1].start - 0.30;
      const endOut = SECONDS;
      const end = t < endIn ? 0 : GLIDE(clampTo((t - endIn) / 0.55, 0, 1));
      await page.evaluate(x => window.__stage.end(x), end);

      /* --- the tap ring --- */
      const since = t - tapAt;
      const ringP = since >= 0 && since < 0.42 ? since / 0.42 : -1;
      await page.evaluate((x, y, p) => window.__stage.ring(x, y, p), tapPoint.x, tapPoint.y, ringP);

      /* --- the captions --- */
      const frame = captionFrame(cap, t);
      const seen = await page.evaluate(fr => {
        window.__cap.apply(fr);
        const acc = window.__stage.accent();
        const vis = [...document.querySelectorAll('.cap-float')]
          .filter(el => getComputedStyle(el).visibility !== 'hidden'
            && parseFloat(getComputedStyle(el).opacity) > 0.02);
        return { vis: vis.length,
          acc: vis.some(g => [...g.querySelectorAll('*')]
            .some(el => getComputedStyle(el).color === acc)) };
      }, frame);
      if (first) {
        if (seen.acc) sawAccent = true;
        maxVisible = Math.max(maxVisible, seen.vis);
        const sum = frame.w.reduce((a, w) => a + w[0] + w[1], 0);
        if (prevSum !== null) capMoved = Math.max(capMoved, Math.abs(sum - prevSum));
        prevSum = sum;
      }

      /* --- the mascot --- */
      await page.evaluate(fr => { window.__mas.apply(fr); window.__stage.mono(); },
        mascotFrame(mas, t));

      /* --- one flush per capture, in both documents --- */
      await page.evaluate(now => window.__stage.tick(now), (SETTLE + idx + 1) * SUBSTEP);

      /* --- the samples, on the frame's own instant --- */
      if (first && f % Math.max(1, Math.round(FPS / 4)) === 0) {
        const s = await page.evaluate(() => ({
          safe: window.__stage.safe(),
          bubble: window.__mas.bubbleSafe(window.__P11.VW, window.__P11.VH),
          band: window.__mas.band(),
          clip: window.__stage.clipCheck(),
          nav: window.__stage.navSeen(),
          lid: window.__stage.siteLid(),
          win: window.__stage.window_(),
          sc: window.__stage.sceneSeen(),
          scInk: window.__stage.sceneInk(),
        }));
        /* what the opening actually rendered, read back, against what it was
           told to. two things are worth catching and both are read off the page
           rather than off the plan: a scene still up after the card has finished
           arriving, which would be the layer sitting on the site, and a frame
           inside the opening with nothing on it at all. */
        if (s.sc) {
          const on = s.sc.on.length > 0;
          const keys = s.sc.on.map(x => x.key).join(',');
          if (on || t <= sc.until + 0.05) {
            scSeen.push({ t: +t.toFixed(2), keys: s.sc.on.map(x => x.key + ' ' + x.o).join(' + '),
              faces: s.sc.faces, flash: s.sc.flash, card: +fade.toFixed(3) });
          }
          /* three separate faults, and they were one loose check before the
             report and the offering existed. an opening scene surviving past the
             card's arrival is the first; **anything** in this layer being up
             while the site card is on screen is the second, because they share a
             rectangle; and anything still up when the end card starts arriving is
             the third, for the same reason. */
          if (on && t > sc.until + 0.05 && s.sc.on.some(x => sc.scenes.some(y => y.key === x.key))) {
            scLate.push({ t: +t.toFixed(2), keys });
          }
          /* the opening's last scene crossing with the arriving site card is the
             one designed overlap in the clip and it has its own guard above. what
             may never share this rectangle is the report or an offering shape,
             because neither has a handover with anything — they arrive into an
             empty box and they have to leave it empty. */
          const late = s.sc.on.filter(x => !sc.scenes.some(y => y.key === x.key))
            .map(x => x.key).join(',');
          if (late && fade > 0.02) scOnCard.push({ t: +t.toFixed(2), keys: late, card: +fade.toFixed(3) });
          if (late && t >= sc.endIn) scOnCard.push({ t: +t.toFixed(2), keys: late, end: true });
          if (!on && fade < 0.02 && t <= sc.until + 0.05) scBlank.push({ t: +t.toFixed(2) });
        }
        if (s.scInk) scInk.push({ t: +t.toFixed(2), ...s.scInk });
        /* ---------- the camera, read back ----------
           node writes a transform and the page renders one, and until the scroll
           above was pinned those two disagreed by a quarter of a page with every
           number in the log saying they agreed. so the window is measured off
           the rendered boxes on every sample and compared against the camera
           that was written. it is the same shape of check `lib/pictograms.mjs`
           runs between its two gsap clocks, and for the same reason: a
           discrepancy nobody measures is a discrepancy nobody finds. */
        if (fade > 0.02 && s.win) {
          const want = cam.cy - SCREEN.h / 2 / cam.z;
          const off = Math.abs(s.win.top - want);
          if (off > 1.5) camFaults.push({ t: +t.toFixed(2), want: +want.toFixed(1), got: s.win.top });
        }
        safeSamples.push({ t: +t.toFixed(2), ...s.safe });
        if (!safeWorst || Math.min(s.safe.left, s.safe.top, s.safe.right, s.safe.bottom)
          < Math.min(safeWorst.left, safeWorst.top, safeWorst.right, safeWorst.bottom)) {
          safeWorst = { t: +t.toFixed(2), ...s.safe };
        }
        if (s.bubble) {
          bubbleSamples++;
          const near = Math.min(s.bubble.left, s.bubble.top, s.bubble.right, s.bubble.bottom);
          if (!bubbleWorst || near < bubbleWorst.near) bubbleWorst = { t: +t.toFixed(2), near, ...s.bubble };
        }
        if (s.band && s.band.hit) masBandHits++;
        /* the band, and it is asked on every sample now rather than only while
           the card is up: the opening draws in the same rectangle the card does,
           so the rule about the caption band is about the frame rather than
           about the card, and a check that only ran when the card was up would
           have had nothing to say about the first ten seconds. */
        {
          const bc = await page.evaluate((a, b) => window.__stage.bandClash(a, b),
            ceiling.top, ceiling.bottom);
          if (bc.n) bandHits.push({ t: +t.toFixed(2), over: bc.over, what: bc.what });
        }
        if (fade > 0.02) {
          if (s.clip && s.clip.clipped) clipFaults.push({ t: +t.toFixed(2), ...s.clip });
          if (s.nav && s.nav.seen) navFaults.push({ t: +t.toFixed(2), ...s.nav });
          /* against the **measured** caption ink rather than against the box it
             is laid out in. the box is 220px tall and the caption is anchored to
             its bottom edge, so testing the box would fail on a collision that
             does not exist — the pictogram layer made exactly that mistake once
             and the guard read as a real check for weeks. it is asked above, on
             every sample, because the opening occupies the same rectangle. */
        }
        if (s.lid != null) {
          if (lidSeen.length && Math.abs(s.lid - lidSeen[lidSeen.length - 1]) > 1e-4) lidMoved++;
          lidSeen.push(s.lid);
        }
      }

      /* the typed line, read back off the field on the frame the hand finishes,
         and the form's own step, sampled at each beat's settled moment. */
      if (first && typedInk === null && t >= site.typing.to && t < site.typing.to + 0.2) {
        typedInk = await page.evaluate(() => window.__stage.typedInk());
      }
      if (first && v.beats.some(b => Math.abs(t - (b.start + 0.3)) < 0.5 / FPS)) {
        steps.push({ t: +t.toFixed(2), ...(await page.evaluate(() => window.__stage.step())) });
      }

      /* ---------- a still per beat ----------
         written **inside** the loop, on the frame it belongs to, because the
         state a still needs is the state the loop is already holding: the
         camera's own position, the card's opacity, the end card, the mascot and
         the caption, all on one clock. re-applying a caption frame after the
         render and shooting that gives fourteen pictures of whatever the last
         frame happened to leave on screen, which is what the first pass of this
         did — every still came back showing the end card. */
      if (first && !shotStill.has(nextStill) && nextStill < stills.length
        && t >= stills[nextStill].at) {
        const png = await cdp.send('Page.captureScreenshot', {
          format: 'png', captureBeyondViewport: false,
          clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF },
        });
        fs.writeFileSync(path.join(VERIFY, stills[nextStill].name), Buffer.from(png.data, 'base64'));
        /* what the card was looking at on the frame that still was taken, so a
           badly composed shot can be read off numbers rather than guessed at
           from the picture. */
        if (fade > 0.02) {
          const w = await page.evaluate(() => ({
            win: window.__stage.window_(),
            pad: window.__stage.rect('.pad'),
          }));
          framing.push({ still: stills[nextStill].name, cy: +cam.cy.toFixed(1), z: +cam.z.toFixed(3),
            win: w.win, pad: w.pad ? { y: +w.pad.page.y.toFixed(1), h: +w.pad.page.h.toFixed(1) } : null });
        }
        shotStill.add(nextStill);
        nextStill++;
      }

      const shot = await cdp.send('Page.captureScreenshot', {
        format: 'jpeg', quality: 94, captureBeyondViewport: false,
        clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF },
      });
      const outFile = SUB > 1
        ? path.join(SUBS, 's' + String(idx).padStart(6, '0') + '.jpg')
        : path.join(FRAMES, 'f' + String(f).padStart(6, '0') + '.jpg');
      fs.writeFileSync(outFile, Buffer.from(shot.data, 'base64'));
      await advance(SUBSTEP);
    }
    if (f % 120 === 0) {
      console.log('  ' + String(f).padStart(5) + '/' + N + '  t=' + (f / FPS).toFixed(2) + 's  '
        + ((Date.now() - wall) / 1000).toFixed(0) + 's elapsed');
    }
  }

  const posts = await page.evaluate(() => window.__stage.win().__dmPosts || 0);
  const sent = await page.evaluate(() => window.__stage.step());

  await browser.close();
  srv.close();
  if (SUB > 1) blend(N);

  return {
    built, ceiling, accent, cyr, faces, contrast, theme: THEME, settle: SETTLE / FPS,
    head: headWorst, safe: safeWorst, safeSamples,
    bubble: bubbleWorst, bubbleSamples, masBandHits,
    taps, calls, fills, camTrail, shots, framing, camFaults, clipFaults, navFaults, bandHits,
    sawAccent, capMoved, maxVisible, typedInk, steps, sent,
    posts: posts - posts0, lidMoved, lidSamples: lidSeen.length,
    sc: {
      seen: scSeen, ink: scInk, late: scLate, blank: scBlank, onCard: scOnCard,
      flash: { peak: +flashPeak.toFixed(4), at: flashAt }, tore, noised,
      duty: scDuty.map((d, i) => ({ key: sc.blocks[i].key, frames: scOn[i], glitching: d,
        duty: scOn[i] ? +(d / scOn[i]).toFixed(3) : 0 })),
    },
  };
}

/* ---------- what the run prints ---------- */
function report(state, v, cut, cap, mas, rep, site, cues, sfx, mix, under, after, lim, best, passes, p, SECONDS, joke, sc) {
  const dev = x => Math.round(x * DSF);
  console.log('\nrendered');
  console.log('  ' + p.w + 'x' + p.h + ' @' + p.fps + 'fps  ' + p.seconds.toFixed(2) + 's  '
    + (p.audio ? 'with the read' : 'SILENT') + '  '
    + (fs.statSync(MP4).size / 1e6).toFixed(2) + ' MB'
    + (p.kbps ? ' at ' + (p.kbps / 1000).toFixed(2) + ' Mbit/s' : ''));
  console.log('  the shutter is ' + (BLUR ? 'open, ' + SUB + ' subframes to a frame' : 'closed'));
  console.log('  ' + path.relative(ROOT, MP4) + ', a still per beat in ' + path.relative(ROOT, VERIFY));

  console.log('\n  the crop');
  console.log('    the card is ' + SCREEN.w + 'x' + SCREEN.h + ' css at ' + SCREEN.x + ',' + SCREEN.y
    + ' — ' + dev(SCREEN.x) + ' left, ' + dev(SCREEN.y) + ' top, '
    + dev(VW - SCREEN.x - SCREEN.w) + ' right and ' + dev(VH - SCREEN.y - SCREEN.h)
    + ' bottom in device px, against floors of ' + SAFE.left + '/' + SAFE.top + '/'
    + SAFE.right + '/' + SAFE.bottom);
  console.log('    the site is filmed at ' + SITE.w + 'x' + SITE.h + ' css px, zoom '
    + Math.min(...state.camTrail.map(c => c.z)).toFixed(3) + ' to '
    + Math.max(...state.camTrail.map(c => c.z)).toFixed(3));
  console.log('    the nav was in the card on ' + state.navFaults.length + ' sampled frames, '
    + 'the subline was in it and cut on ' + state.clipFaults.length);
  console.log('    the shots, as they resolved:');
  for (const sh of state.shots) {
    console.log('      beat ' + String(sh.beat).padStart(2) + '  ' + sh.t.toFixed(2) + 's  '
      + sh.ease.padEnd(6) + ' ' + sh.sel.padEnd(22) + ' z ' + sh.z.toFixed(3)
      + ' cy ' + sh.cy.toFixed(0)
      + '  shows ' + sh.shows.w + 'x' + sh.shows.h + ' of a ' + sh.box.w + 'x' + sh.box.h
      + ' box at y ' + sh.box.y + ', ' + sh.align + ', scroll ' + JSON.stringify(sh.scroll)
      + (sh.cleared.length ? '  clear of ' + sh.cleared.join(' ') : '')
      + (sh.pushed ? '  pushed under the subline' : ''));
  }
  console.log('    and what the card was looking at when each still was taken:');
  for (const f of state.framing) {
    console.log('      ' + f.still.padEnd(12) + ' z ' + f.z.toFixed(3) + '  window '
      + f.win.top + '..' + f.win.bottom + ' (node said cy ' + f.cy + ')'
      + (f.pad ? '   the form runs ' + f.pad.y + '..' + (f.pad.y + f.pad.h).toFixed(1) : ''));
  }
  console.log('    the site\'s own mascot blinked: the lid changed on ' + state.lidMoved
    + ' of ' + state.lidSamples + ' samples');
  console.log('    ' + state.taps.length + ' taps, all inside the card: '
    + state.taps.every(t => t.inCard));
  for (const t of state.taps) console.log('      ' + t.t.toFixed(2) + 's  ' + t.note + '  ' + t.sel);
  console.log('    ' + state.calls.length + ' calls into the page:');
  for (const c of state.calls) console.log('      ' + c.t.toFixed(2) + 's  ' + c.what + ' -> ' + c.got);
  if (state.typedInk) {
    console.log('    the typed line reads "' + state.typedInk.text + '" at '
      + state.typedInk.capPx + ' device px of cap');
  }
  console.log('    the form ended on: ' + (state.sent.sent ? 'the check mark' : 'step "' + state.sent.q + '"')
    + ', and ' + state.posts + ' posts were intercepted (nothing left the browser)');

  console.log('\n  the frame');
  console.log('    caption ceiling ' + state.ceiling.top + ', the card ends at '
    + (SCREEN.y + SCREEN.h) + ', clear air ' + (state.ceiling.top - (SCREEN.y + SCREEN.h)).toFixed(1)
    + 'px (floor ' + CARD_CLEARANCE + ')');
  console.log('    safe area, worst of ' + state.safeSamples.length + ' samples at '
    + state.safe.t + 's: ' + dev(state.safe.left) + ' left, ' + dev(state.safe.top) + ' top, '
    + dev(state.safe.right) + ' right, ' + dev(state.safe.bottom) + ' bottom (tightest is '
    + state.safe.worst + ')');
  console.log('    the head, worst of every frame at ' + state.head.t + 's: '
    + state.head.left + ' left, ' + state.head.top + ' top, ' + state.head.right + ' right, '
    + state.head.bottom + ' bottom');
  console.log('    the bubble, worst of ' + state.bubbleSamples + ' samples'
    + (state.bubble ? ' at ' + state.bubble.t + 's: ' + state.bubble.left + ' left, '
      + state.bubble.top + ' top, ' + state.bubble.right + ' right, '
      + state.bubble.bottom + ' bottom' : ': never sampled on screen'));
  console.log('    the caption band was entered by the bubble ' + state.masBandHits
    + ' times and by the card ' + state.bandHits.length);
  console.log('    the accent was painted on a caption: ' + state.sawAccent
    + ' (this clip has no green in it at all)');

  console.log('\n  the type');
  console.log('    the end card is three stacked lines at ' + state.built.wordmarkPx
    + 'px, fitted so `boring` occupies ' + END.wordmarkW + 'px, with the address under it at '
    + state.built.domPx + 'px');
  console.log('      the group runs ' + state.built.end.top + '..' + state.built.end.bottom
    + ' css, centred on ' + END.centreY + ', and the caption ceiling is ' + state.ceiling.top);
  console.log('    the head rendered at ' + state.built.mas.headPx + ' device px, the bubble caps at '
    + state.built.caps.capPx + ' (floor ' + BUBBLE.minCap + ') and the outline at '
    + state.built.mas.strokePx + ' device px');
  console.log('    cyrillic: ' + state.cyr.note + '. the pill sets it in '
    + (state.cyr.mono ? 'the mono stack' : 'the caption face') + ' — ' + state.cyr.family);
  console.log('      at 100px: "привет" is ' + state.cyr.cyr.sg + ' in space grotesk, '
    + state.cyr.cyr.mono + ' in the mono stack and ' + state.cyr.cyr.none
    + ' in the browser default; the latin control is ' + state.cyr.control.sg
    + ' against ' + state.cyr.control.none + ', so the probe can tell two faces apart');

  console.log('\n  the opening');
  console.log('    four scenes in the card box, ' + sc.scenes[0].from.toFixed(2) + '..'
    + sc.scenes[3].to.toFixed(2) + 's, handover windows of ' + sc.xf.toFixed(2)
    + 's — the same window the card arrives over — with a ' + SC_CROSS.toFixed(2)
    + 's complementary exchange at ' + (SC_CROSS_AT * 100).toFixed(0) + '% of each');
  for (const s of sc.scenes) {
    const m = (state.built.scenes || []).find(x => x.key === s.key) || { lines: [] };
    console.log('      ' + (s.k + 1) + '  ' + s.in.t0.toFixed(2) + '..' + s.out.t1.toFixed(2)
      + '  line ' + s.line + ' runs ' + s.beat.start.toFixed(2) + '..' + s.beat.end.toFixed(2)
      + '   ' + s.lines.map(l => l.t.toUpperCase()).join(' / '));
    console.log('           window ' + s.in.t0.toFixed(2) + '..' + s.in.t1.toFixed(2)
      + ' then ' + s.out.t0.toFixed(2) + '..' + s.out.t1.toFixed(2)
      + ', and it is up over ' + s.crossIn.t0.toFixed(2) + '..' + s.crossIn.t1.toFixed(2)
      + ' and down over ' + s.crossOut.t0.toFixed(2) + '..' + s.crossOut.t1.toFixed(2)
      + (s.k === 3 ? '  (inside the card\'s own arrival, by reference)' : ''));
    console.log('           type: ' + m.lines.map(l => '"' + l.t + '" ' + l.px + 'px = '
      + l.capPx + ' device px of cap').join(', ') + '  (fitted on ' + m.by + ')');
    if (s.wordsAt != null) {
      console.log('           the words glitch in at ' + s.wordsAt.toFixed(2) + 's, on "'
        + s.wordsOn + '", over ' + SC_GLITCH.entry.toFixed(2) + 's');
    }
    if (s.faces.length) {
      console.log('           ' + s.faces.length + ' orange heads, "' + SC_AI.text
        + '" where the face was, on '
        + s.faces.reduce((a, w) => a + w.length, 0) + ' windows between them'
        + (state.built.ai ? ': ' + state.built.ai.px + 'px of type on a '
          + state.built.ai.plate + ' device px head, ' + state.built.ai.capPx
          + ' device px of cap (floor ' + SC_MIN_CAP + ')' : ''));
    }
    if (s.dips.length) console.log('           the tube flickers in ' + SC_TUBE.base[0]
      + '..' + SC_TUBE.base[1] + ' with ' + s.dips.length + ' one frame dips to '
      + SC_TUBE.dip[0] + '..' + SC_TUBE.dip[1]);
  }
  console.log('    the glow on the ' + THEME + ' page: '
    + (SC_GLOW[THEME].length
      ? SC_GLOW[THEME].map(([b, a]) => b + 'px at ' + (a * 100).toFixed(0) + '%').join(', ')
        + ' of white, layered'
      : 'none — ink on paper, which is what a glow on a white page would have to be'));
  console.log('    the glitch: split ' + (THEME === 'dark' ? SC_GLITCH.splitDark : SC_GLITCH.splitLight)
    + 'px, jitter ' + SC_GLITCH.jitter + 'px, bursts '
    + (SC_GLITCH.burst[0] * 1000).toFixed(0) + '..' + (SC_GLITCH.burst[1] * 1000).toFixed(0)
    + 'ms every ' + SC_GLITCH.every[0].toFixed(2) + '..' + SC_GLITCH.every[1].toFixed(2) + 's, '
    + 'quantised to the output frame so the shutter cannot smear it');
  console.log('    and how much of each scene is actually glitching, against a '
    + (SC_GLITCH.dutyMax * 100).toFixed(0) + '% ceiling:');
  for (const d of (state.sc || { duty: [] }).duty) {
    console.log('      ' + d.key.padEnd(10) + ' ' + String(d.glitching).padStart(3) + ' of '
      + String(d.frames).padStart(3) + ' frames  ' + (d.duty * 100).toFixed(1) + '%');
  }
  console.log('    the days: "' + SC_DAYS.lines.join(' / ').toUpperCase() + '" land on "'
    + sc.days.word + '" at ' + sc.days.at.toFixed(2) + ', torn into ' + SC_DAYS.bands
    + ' bands for ' + (SC_TV.hard * 1000).toFixed(0) + 'ms hard plus a '
    + (SC_TV.tail * 1000).toFixed(0) + 'ms stutter, gone by ' + sc.days.out.t1.toFixed(2));
  console.log('      the fault: tear ' + SC_TV.tear + 'px, split ' + SC_TV.split
    + 'px, jitter ' + SC_TV.jitter + 'px, noise ' + SC_TV.noise + ', scanlines ' + SC_TV.scan);
  console.log('      the white frame peaks at ' + (state.sc ? state.sc.flash.peak.toFixed(3) : '?')
    + ' (written ' + sc.days.flash.to.toFixed(2) + ', ceiling ' + SC_FLASH.max + ') at '
    + (state.sc && state.sc.flash.at != null ? state.sc.flash.at.toFixed(2) : '?') + 's');
  console.log('    the report: slides in from ' + sc.report.slide.t0.toFixed(2) + ' at x+'
    + SC_REPORT.from.x + ' and ' + SC_REPORT.from.r + ' degrees, lands on "' + sc.report.word
    + '" at ' + sc.report.land.toFixed(2) + ', settles at ' + SC_REPORT.rest.r + ' degrees');
  console.log('      the page rides the slide; the five things on it land at '
    + sc.report.bricks.slice(1).map(b => b.t0.toFixed(2)).join(', ')
    + ', each falling ' + (SC_REPORT.fall * 1000).toFixed(0) + 'ms with its own squash;'
    + ' gone by ' + sc.report.out.t1.toFixed(2));
  console.log('    the chalkboard: "' + SC_MAP.centre + '" at ' + sc.map.centreAt.toFixed(2)
    + ', six nodes, cleared at ' + sc.map.off.toFixed(2)
    + ' against an end card at ' + sc.endIn.toFixed(2));
  for (const n of sc.map.nodes) {
    console.log('      ' + n.key.padEnd(8) + ' ' + n.on.toFixed(2) + 's  '
      + (n.word ? 'on "' + n.word + '"' : 'in the gap at ' + n.gap.toFixed(2)));
  }
  if (state.built && state.built.chalk) {
    console.log('      the chalk measures ' + state.built.chalk.map(c => c.t + ' '
      + c.capPx + 'dp').join(', ') + ' of cap (floor ' + SC_MIN_CAP + ')');
  }
  if (state.sc) {
    console.log('    read back off the page: ' + state.sc.seen.length + ' samples with the layer on, '
      + state.sc.late.length + ' opening scenes after the card had arrived, '
      + state.sc.onCard.length + ' frames sharing the box with the site card or the end card, '
      + state.sc.blank.length + ' with nothing on screen at all');
    const ink = state.sc.ink;
    if (ink.length) {
      const l = Math.min(...ink.map(i => i.left)), t2 = Math.min(...ink.map(i => i.top));
      const r = Math.max(...ink.map(i => i.right)), b2 = Math.max(...ink.map(i => i.bottom));
      console.log('      the ink, over every sample and every jitter, runs ' + l.toFixed(0)
        + '..' + r.toFixed(0) + ' across and ' + t2.toFixed(0) + '..' + b2.toFixed(0) + ' down — '
        + dev(l) + ' left, ' + dev(t2) + ' top, ' + dev(VW - r) + ' right in device px, and the '
        + 'caption ceiling is at ' + state.ceiling.top);
    }
  }

  console.log('\n  the mascot');
  console.log('    ' + mas.marks.length + ' marks, ' + mas.marks.reduce((a, m) => a + (m.bubbles || []).length, 0)
    + ' bubbles, resting turn ' + mas.bias);
  for (const m of mas.marks) {
    console.log('      ' + m.t.toFixed(2) + 's  ' + m.state.padEnd(12)
      + (m.bubbles || []).map(b => '"' + b.text + '" ' + b.in.toFixed(2)).join('  '));
  }

  console.log('\n  the read');
  console.log('    fourteen takes in the narrator\'s voice, and one that is not: '
    + joke.voice + ' (' + joke.voiceId + ') reads the typed line from '
    + joke.at.from.toFixed(2) + 's to ' + joke.at.to.toFixed(2) + 's, '
    + JOKE.trimDb.toFixed(1) + ' dB under the narrator, over a hand typing from '
    + site.typing.from.toFixed(2) + 's to ' + site.typing.to.toFixed(2) + 's');
  console.log('    it is not captioned, because the words are already on screen in the field');
  for (const x of cut.exceptions) {
    console.log('    the drawn caption is the spoken caption on every line but ' + x.line
      + ', which says "' + x.say.join(' ') + '" and draws "' + x.draw + '" at '
      + x.at + 's, ' + x.hits + ' match');
  }

  console.log('\n  the mix');
  console.log(describeMix(sfx.report, {
    'the read': LINES.length + ' takes, one per line, each with its own rate and pitch',
    'the delivery': v.beats.map(b => b.rate + '/' + b.pitch).join(' '),
    'words a second': Math.min(...v.beats.map(b => b.wps)).toFixed(2) + ' to '
      + Math.max(...v.beats.map(b => b.wps)).toFixed(2) + ' against a flat 2.3',
    'the gaps': v.gaps.map(g => g.toFixed(2)).join(' ') + ' s, measured on the waveform',
    'music': 'none in this pass',
    /* both readings carry the second they were taken at now. a number with no
       timestamp on it is a number nobody can go and look at, and the instant
       reading in particular is one sample in a forty seven second file. */
    'the bus under the voice': (-under.worst.db).toFixed(1) + ' dB under at its closest ('
      + under.worst.at.toFixed(2) + 's) in ' + under.windows + ' windows a word is being spoken '
      + 'in, and the stricter instantaneous reading is ' + (-under.instant.db).toFixed(1)
      + ' dB at ' + under.instant.at.toFixed(2) + 's',
    'loudness': after.lufs.toFixed(1) + ' LUFS delivered (target ' + TARGET_LUFS + '), best of '
      + passes.length + ' pass(es) at ' + (best.lift >= 0 ? '+' : '') + best.lift + ' dB',
    'true peak': (after.truePeak == null ? '?' : after.truePeak.toFixed(1))
      + ' dBTP (ceiling ' + PEAK_CEILING + ')',
    'the limiter': lim.reduction.toFixed(1) + ' dB at its hardest, ceiling '
      + best.ceiling.toFixed(2),
  }));
}

/* ---------- the guards ----------
   the shape every clip in here uses: the thing must have happened, it must have
   happened everywhere it was supposed to, and every claim in the log above must
   be a measurement. */
function guard(state, v, cut, cap, mas, rep, site, cues, mix, under, after, lim, p, SECONDS, joke, sc) {
  const fail = [];
  const floor = Math.min(SAFE.left, SAFE.top, SAFE.right, SAFE.bottom);

  /* the file */
  if (p.w !== VW * DSF || p.h !== VH * DSF) fail.push('not ' + VW * DSF + 'x' + VH * DSF);
  if (Math.abs(p.fps - FPS) > 0.5) fail.push('not ' + FPS + 'fps');
  if (Math.abs(p.seconds - SECONDS) > 0.25) fail.push(p.seconds + 's, wanted ' + SECONDS.toFixed(2));
  if (!p.audio) fail.push('no audio track — the read did not mux');

  /* the crop, which is the whole framing argument */
  if (state.navFaults.length) {
    fail.push('the site\'s top nav was inside the card on ' + state.navFaults.length
      + ' sampled frames, first at ' + state.navFaults[0].t + 's');
  }
  if (state.clipFaults.length) {
    fail.push('the subline was in the card and cut on ' + state.clipFaults.length
      + ' sampled frames, first at ' + state.clipFaults[0].t + 's');
  }
  if (state.camFaults.length) {
    fail.push('the card rendered a different framing from the one the camera wrote on '
      + state.camFaults.length + ' samples, first at ' + state.camFaults[0].t + 's ('
      + state.camFaults[0].want + ' wanted, ' + state.camFaults[0].got + ' drawn) — '
      + 'something is scrolling under the transform');
  }
  if (!state.taps.length) fail.push('nothing was ever tapped');
  for (const t of state.taps) {
    if (!t.inCard) fail.push('the tap on ' + t.sel + ' at ' + t.t + 's landed outside the card');
  }
  if (state.posts !== 2) {
    fail.push(state.posts + ' posts were intercepted and it has to be exactly 2 — '
      + 'either the send did not happen or something else reached the network');
  }
  if (!state.sent.sent) fail.push('the form never reached its check mark, so the send beat is a lie');
  if (!state.lidMoved) fail.push('the site\'s own mascot never blinked — the capture is a still page');

  /* the frame */
  const clear = state.ceiling.top - (SCREEN.y + SCREEN.h);
  if (clear < CARD_CLEARANCE) {
    fail.push('only ' + clear.toFixed(1) + 'px between the site card and the tallest caption, floor '
      + CARD_CLEARANCE);
  }
  if (state.ceiling.tallest <= 0) fail.push('the caption ceiling measured nothing, so the clearance is against nothing');
  const near = Math.min(state.safe.left, state.safe.top, state.safe.right, state.safe.bottom);
  if (near * DSF < floor - 0.5) {
    fail.push('what we draw comes within ' + Math.round(near * DSF) + ' device px of a border at '
      + state.safe.t + 's (' + state.safe.worst + '), floor is ' + floor);
  }
  if (state.head.near < floor - 0.5) {
    fail.push('the head comes within ' + Math.round(state.head.near) + 'px of a border at '
      + state.head.t + 's, floor is ' + floor);
  }
  if (state.bubble && state.bubble.near < floor - 0.5) {
    fail.push('the bubble comes within ' + Math.round(state.bubble.near) + 'px of a border at '
      + state.bubble.t + 's, floor is ' + floor);
  }
  if (!state.bubbleSamples) fail.push('the bubble was never sampled on screen');
  if (state.masBandHits) fail.push('the bubble entered the caption band ' + state.masBandHits + ' times');
  if (state.bandHits.length) {
    fail.push('the site card overlapped the caption band on ' + state.bandHits.length + ' samples');
  }

  /* ---------- the opening ----------
     the four scenes fill the card box for the first four lines and then hand it
     to the site card. what has to be true of them is the same shape as what has
     to be true of everything else in this file: it happened, it is legible, it
     is where it says it is, and the handover is arithmetic rather than a hope.

     the handover is the item worth reading twice. the last scene's exit is not
     "the same numbers as" the card's arrival, it **is** the record `planSite`
     wrote, taken by reference — so this check is asking whether that is still
     the case rather than whether two hand written numbers still agree. */
  const cf = site.fades.find(f => f.to === 1);
  const last = sc.scenes[sc.scenes.length - 1];
  if (last.out.t0 !== cf.t0 || last.out.t1 !== cf.t1) {
    fail.push('the last scene\'s handover window is ' + last.out.t0 + '..' + last.out.t1
      + ' and the card arrives over ' + cf.t0 + '..' + cf.t1 + ', so there is a jump or a hole '
      + 'between the opening and the site');
  }
  if (last.crossOut.t0 < cf.t0 || last.crossOut.t1 > cf.t1) {
    fail.push('the last scene leaves over ' + last.crossOut.t0 + '..' + last.crossOut.t1
      + ', which is outside the card\'s own arrival');
  }
  /* and the two ends of a handover are the same exchange: scene k arrives over
     exactly the window scene k-1 leaves over, so nothing can be on screen twice
     and nothing can be on screen never. */
  for (let i = 1; i < sc.scenes.length; i++) {
    const a = sc.scenes[i - 1].crossOut, b = sc.scenes[i].crossIn;
    if (a.t0 !== b.t0 || a.t1 !== b.t1) {
      fail.push('scene ' + i + ' leaves over ' + a.t0 + '..' + a.t1 + ' and scene ' + (i + 1)
        + ' arrives over ' + b.t0 + '..' + b.t1 + ', so they are not the same exchange');
    }
  }
  if (state.sc) {
    if (state.sc.late.length) {
      fail.push('the opening was still on screen after the card had arrived, on '
        + state.sc.late.length + ' samples, first at ' + state.sc.late[0].t + 's ('
        + state.sc.late[0].keys + ')');
    }
    if (state.sc.blank.length) {
      fail.push(state.sc.blank.length + ' sampled frames inside the opening with no scene and no '
        + 'card on them, first at ' + state.sc.blank[0].t + 's');
    }
    if (state.sc.onCard.length) {
      fail.push('this layer and the site card or the end card were in the same rectangle on '
        + state.sc.onCard.length + ' samples, first at ' + state.sc.onCard[0].t + 's ('
        + state.sc.onCard[0].keys + ')');
    }
    if (!state.sc.seen.length) fail.push('the opening was never sampled on screen at all');
    if (!state.sc.seen.some(x => x.faces > 0)) {
      fail.push('the five orange faces were never on screen on any sample');
    }
    for (const d of state.sc.duty) {
      if (!d.frames) fail.push('the scene "' + d.key + '" is never up for a single frame');
      else if (!d.glitching) fail.push('the scene "' + d.key + '" never glitches on any frame');
      else if (d.duty > SC_GLITCH.dutyMax) {
        fail.push('the scene "' + d.key + '" is glitching on ' + (d.duty * 100).toFixed(1)
          + '% of its own frames, ceiling is ' + (SC_GLITCH.dutyMax * 100).toFixed(0)
          + '% — a burst that long is a look rather than a fault');
      }
    }
  } else fail.push('the render reported nothing at all about the opening');
  /* ---------- the days, the report and the chalkboard ----------
     all three are hung off words rather than off numbers, so what has to be
     checked is that they still land on those words after any retiming, that the
     fault is a fault rather than a white-out, that the page is built rather than
     faded, and that the three of them queue rather than overlap. */
  const dWord = wordAt(v.beats[SC_DAYS.line - 1], SC_DAYS.on);
  if (Math.abs(sc.days.at - dWord.start) > 0.5 / FPS) {
    fail.push('the days land at ' + sc.days.at + ' and the word "' + SC_DAYS.on
      + '" is said at ' + dWord.start.toFixed(3));
  }
  if (sc.days.flash.peak !== sc.days.at) {
    fail.push('the white frame is at ' + sc.days.flash.peak + ' and the fault is at '
      + sc.days.at + ' — it is part of the glitch and it has to be on it');
  }
  /* short and sharp, and this is the number that says so: the whole fault,
     hard plus stutter, against a ceiling. */
  const tvLen = +(SC_TV.hard + SC_TV.tail).toFixed(3);
  if (tvLen > 0.34) {
    fail.push('the tv glitch runs ' + tvLen + 's, which is long enough to read as a broken '
      + 'render rather than as a fault');
  }
  const rWord = wordAt(v.beats[SC_REPORT.line - 1], SC_REPORT.on);
  if (Math.abs(sc.report.land - rWord.start) > 0.5 / FPS) {
    fail.push('the report lands at ' + sc.report.land + ' and the word "' + SC_REPORT.on
      + '" is said at ' + rWord.start.toFixed(3));
  }
  if (sc.report.bricks.length !== 6) {
    fail.push('the report builds in ' + sc.report.bricks.length + ' blocks and the drawing has 6');
  }
  if (!sc.report.bricks[0].page || sc.report.bricks[0].t0 !== sc.report.slide.t0) {
    fail.push('block zero is not the page riding the slide, so the page has nothing to slide in');
  }
  for (let i2 = 1; i2 < sc.report.bricks.length; i2++) {
    if (sc.report.bricks[i2].t0 <= sc.report.bricks[i2 - 1].t0) {
      fail.push('the report blocks are not in order at ' + i2);
    }
  }
  /* the page slides in rather than appearing: it has to start outside the box
     it ends up in, and it has to be clipped or it would be outside the frame. */
  if (SC_REPORT.from.x < SCREEN.w / 3) {
    fail.push('the report starts ' + SC_REPORT.from.x + 'px off its resting place, which is not '
      + 'far enough to read as coming in from the side');
  }
  if (Math.abs(SC_REPORT.rest.r) < 1.5) {
    fail.push('the report settles at ' + SC_REPORT.rest.r + ' degrees, which is square to the '
      + 'frame — it is meant to look placed by a hand');
  }
  if (state.sc) {
    const fp = state.sc.flash;
    if (fp.peak > SC_FLASH.max) {
      fail.push('the white frame reached ' + fp.peak + ' and the ceiling is ' + SC_FLASH.max
        + ' — that is a white-out rather than a fault');
    }
    if (fp.peak < sc.days.flash.to * 0.5) {
      fail.push('the white frame was written to peak at ' + sc.days.flash.to
        + ' and the highest any rendered frame reached is ' + fp.peak);
    }
    if (!state.sc.tore) fail.push('no rendered frame had a torn band on it');
    if (!state.sc.noised) fail.push('the noise burst was never on screen');
  }
  if (sc.map.nodes.length !== SC_NODES.length) {
    fail.push(sc.map.nodes.length + ' chalk nodes and there are ' + SC_NODES.length);
  }
  for (const n of sc.map.nodes) {
    if (!n.word) continue;
    const w = wordAt(v.beats[SC_MAP_LINE - 1], n.word);
    if (Math.abs(n.at - w.start) > 0.5 / FPS) {
      fail.push('the "' + n.key + '" node lands at ' + n.at + ' and its word "' + n.word
        + '" is said at ' + w.start.toFixed(3));
    }
  }
  for (let i2 = 1; i2 < sc.map.nodes.length; i2++) {
    const gap = sc.map.nodes[i2].on - sc.map.nodes[i2 - 1].on;
    if (gap < 0.18) {
      fail.push('"' + sc.map.nodes[i2].key + '" pops ' + gap.toFixed(2) + 's after "'
        + sc.map.nodes[i2 - 1].key + '", which is two things arriving at once');
    }
  }
  if (sc.map.centreAt >= sc.map.nodes[0].on) {
    fail.push('the centre of the map arrives at ' + sc.map.centreAt + ' and the first node points '
      + 'at it from ' + sc.map.nodes[0].on + ' — an arrow into nothing');
  }
  if (sc.map.off > sc.endIn) {
    fail.push('the chalkboard is up at ' + sc.map.off + ' and the end card starts arriving at '
      + sc.endIn + ' — they share the same rectangle');
  }
  if (sc.days.out.t1 >= sc.report.slide.t0) {
    fail.push('the days are still leaving at ' + sc.days.out.t1
      + ' and the report starts sliding in at ' + sc.report.slide.t0);
  }
  if (sc.report.out.t1 >= sc.map.on) {
    fail.push('the report is still leaving at ' + sc.report.out.t1
      + ' and the chalkboard arrives at ' + sc.map.on);
  }
  /* the chalk has to be readable at phone size, on the same floor the opening
     scenes and the mascot bubble hold to. */
  for (const c of (state.built.chalk || [])) {
    if (c.capPx < SC_MIN_CAP) {
      fail.push('the chalk word "' + c.t + '" renders at ' + c.capPx
        + ' device px of cap, floor is ' + SC_MIN_CAP);
    }
  }
  if (!(state.built.chalk || []).length) fail.push('the chalkboard never measured its own type');

  /* the letters inside a head. this is the one number the change to the heads
     was made for: the eyes came out because they did not read at that size, and
     what replaced them has to read at that size or the change bought nothing.
     the head grows before the letters shrink, so a failure here is a note to
     make SC_FACES bigger rather than SC_AI smaller. */
  const ai = state.built.ai;
  if (!ai) fail.push('the heads never measured the letters inside them');
  else {
    if (ai.text !== SC_AI.text) {
      fail.push('a head is carrying "' + ai.text + '" and it should carry "' + SC_AI.text + '"');
    }
    if (ai.capPx < SC_MIN_CAP) {
      fail.push('"' + ai.text + '" inside a head renders at ' + ai.capPx
        + ' device px of cap, floor is ' + SC_MIN_CAP + ' — make the heads larger rather than '
        + 'the letters smaller');
    }
    /* and it has to still be inside the head it is in. the plate is a circle, so
       what has to fit is the corner of the text box against the radius. */
    const rad = ai.plate / 2;
    const corner = Math.hypot(ai.widthPx / 2, ai.capPx / 2);
    if (corner > rad - 6) {
      fail.push('"' + ai.text + '" reaches ' + corner.toFixed(1) + ' device px from the middle of a '
        + 'head whose plate is ' + rad.toFixed(1) + ' — the letters are touching the edge');
    }
  }

  /* the type, and the same question the typed line is asked: can anybody read
     it. this one is held to the caption's own floor rather than to a filmed
     interface's, because it is our type at our size and there is no excuse. */
  const built = state.built.scenes || [];
  if (built.length !== sc.blocks.length) {
    fail.push(built.length + ' blocks measured themselves and there are ' + sc.blocks.length);
  }
  for (const m of built) {
    for (const l of m.lines) {
      if (l.capPx < SC_MIN_CAP) {
        fail.push('"' + l.t + '" in the ' + m.key + ' scene renders at ' + l.capPx
          + ' device px of cap, floor is ' + SC_MIN_CAP);
      }
    }
  }
  /* the size joke has to be a joke: SMALL is set smaller than the two words
     either side of it, and by enough that it reads as a decision. */
  const small = built.find(m => m.key === 'small');
  if (!small) fail.push('the size joke scene never measured itself');
  else {
    const mid = small.lines[1], sides = [small.lines[0], small.lines[2]];
    if (!mid || mid.t !== 'small') fail.push('the middle line of the size joke is not "small"');
    else if (!(mid.px < Math.min(...sides.map(s => s.px)) * 0.55)) {
      fail.push('"small" is set at ' + mid.px + 'px against ' + sides.map(s => s.px).join(' and ')
        + ' either side of it, which is not a size joke');
    }
  }
  /* and the layer is under everything, measured rather than promised. */
  const z = state.built.scZ;
  if (!z) fail.push('the opening never reported its own depth');
  else {
    for (const [what, v2] of [['the card', z.card], ['the captions', z.cap], ['the mascot', z.mascot]]) {
      if (!(Number(z.scene) < Number(v2))) {
        fail.push('the opening is at z-index ' + z.scene + ' and ' + what + ' is at ' + v2
          + ', so the layer can get in front of it');
      }
    }
  }

  /* the captions */
  if (state.sawAccent) fail.push('the accent was painted on a caption and this clip has no green in it');
  if (cap.flashed && cap.flashed.length) fail.push('a word was marked to flash and nothing should be');
  if (state.maxVisible > 1) fail.push(state.maxVisible + ' caption cards were on screen at once');
  if (!state.capMoved) fail.push('the caption never moved between two frames');
  if (cap.tight && cap.tight.late && cap.tight.late.length) {
    fail.push(cap.tight.late.length + ' cards leave before their own last word is said');
  }
  /* the half the cut marks cannot fake: the voice said these words, in this
     order, and the cards are those words with nothing added and nothing lost.

     one line is allowed to differ and it is named. the substitution is applied
     to the **spoken** string here, so the comparison still starts from what came
     out of the synthesiser rather than from what `markLines` decided to draw —
     and the exception has to have fired exactly once, because an exception that
     stopped matching would leave a guard that passes on a caption nobody
     checked. */
  let said = v.words.map(w => bareWord(w.word)).join(' ');
  for (const x of SAY_AS) {
    const run = x.say.join(' ');
    const hit = (cut.exceptions.find(e => e.line === x.line) || {}).hits;
    if (hit !== 1) {
      fail.push('the "' + x.draw + '" exception fired ' + (hit || 0) + ' times on line '
        + x.line + ' and it has to fire exactly once — the line no longer says "'
        + run + '"');
    }
    if (!said.includes(run)) {
      fail.push('the voice never said "' + run + '", so the "' + x.draw
        + '" exception is drawing something nobody read');
      continue;
    }
    said = said.replace(run, x.draw);
  }
  const drawn = cap.cells.map(c => c.word).join(' ');
  if (said !== drawn) {
    fail.push('the drawn caption is not what was spoken — the words diverge at "'
      + drawn.slice(0, 60) + '"');
  }
  /* and no card holds the end of one screen beat and the start of the next,
     which is what the marks are for. */
  for (const g of cap.groups) {
    const a = v.beats.findIndex(b => g.words[0].start >= b.start - 1e-6 && g.words[0].start <= b.end + 1e-6);
    const z = v.beats.findIndex(b => g.words[g.words.length - 1].start >= b.start - 1e-6
      && g.words[g.words.length - 1].start <= b.end + 1e-6);
    if (a !== z) {
      fail.push('card "' + g.words.map(w => w.word).join(' ') + '" straddles lines '
        + (a + 1) + ' and ' + (z + 1));
    }
  }

  /* the cyrillic answer, which the brief asked to be verified rather than
     assumed. the face has to be able to set it and the caps have to clear the
     same floor every other bubble clears. */
  if (!state.cyr.methodWorks) {
    fail.push('the font probe cannot tell two faces apart on a latin control, so its '
      + 'answer about cyrillic means nothing');
  }
  if (state.cyr.setsCyrillic) {
    fail.push('space grotesk now sets cyrillic — the mono fallback is no longer needed '
      + 'and this file should be re-read before it is trusted');
  }
  if (!state.cyr.monoDiffers) {
    fail.push('the mono stack renders "привет" at the browser default width, so no font '
      + 'on this machine is actually setting it');
  }
  if (!state.cyr.mono) fail.push('the cyrillic bubble did not drop to the mono stack');
  if (state.cyr.caps.capPx < BUBBLE.minCap) {
    fail.push('the cyrillic bubble measured ' + state.cyr.caps.capPx
      + ' device px of cap, floor is ' + BUBBLE.minCap);
  }

  /* ---------- no dead air ----------
     every hole in the read is measured on the waveform. the shape it is checked
     against changed when the confirmation stopped being silent, and the check
     got **narrower** rather than looser, twice. there used to be two named holes
     and the second of them was allowed to run three seconds while a check mark
     was drawn in it. then there was **one** hole allowed to be long, the one the
     hand types in, and everything else under 1.70s. now the two numbers are
     separate, because they were never measuring the same thing, and both are
     tighter than the one they replace:

       HOLE_MAX       any hole that is not the typing one. the longest in the
                      clip is the 0.95s the send is pressed in, so 1.20 is the
                      real shape with a little room and 1.70 was a number left
                      over from when the confirmation sat in silence.
       TYPE_TAIL_MAX  how far the typing hole may run past the last keystroke
                      with nothing in it. it runs 1.33s, so 1.50 is that shape.
                      it is a different question from the one above and it was
                      only ever sharing a constant with it by accident.

     and the beat the long hole used to hold is checked positively: the check
     mark has to be drawn while a word is being said. that is the thing the guard
     is actually for, and it is the half a length limit cannot express. */
  const HOLE_MAX = 1.20;
  const TYPE_TAIL_MAX = 1.50;
  const holes = [];
  for (let i = 1; i < v.beats.length; i++) {
    const from = v.beats[i - 1].sound.end, to = v.beats[i].sound.start;
    if (to - from > 0.60) holes.push({ from: +from.toFixed(2), to: +to.toFixed(2), len: +(to - from).toFixed(2) });
  }
  const typed = holes.find(h => h.from <= site.typing.from && h.to >= site.typing.to);
  if (!typed) {
    fail.push('no hole in the read holds the typing, so the hand is being heard over a line');
  } else if (typed.to - site.typing.to > TYPE_TAIL_MAX) {
    fail.push('the typing hole runs ' + (typed.to - site.typing.to).toFixed(2)
      + 's past the last keystroke with no voice in it, ceiling ' + TYPE_TAIL_MAX);
  }
  for (const h of holes) {
    if (h === typed || h.len <= HOLE_MAX) continue;
    fail.push('a ' + h.len + 's hole at ' + h.from + '..' + h.to + ' with no voice and no caption '
      + 'in it, and the only hole allowed past ' + HOLE_MAX + 's is the one the hand types in');
  }
  /* the check mark is drawn under a word. it used to be drawn in the hole above
     and that is the whole reason the hole above is gone. */
  const over = v.beats.find(b2 => site.confirmAt >= b2.sound.start - 0.30
    && site.confirmAt <= b2.sound.end + 0.30);
  if (!over) {
    fail.push('the check mark is drawn at ' + site.confirmAt.toFixed(2)
      + 's with nothing being said over it');
  }
  /* and the press is still a press somebody makes after being told to. */
  if (site.sendAt < v.beats[13].end) {
    fail.push('the send is pressed at ' + site.sendAt.toFixed(2) + 's, before `send it` has finished at '
      + v.beats[13].end.toFixed(2) + 's');
  }
  /* the stub in `injected()` and the STUB the send is timed through are the same
     number, read off the function's own source rather than trusted. */
  if (!new RegExp('\\), ' + Math.round(STUB * 1000) + '\\)\\);').test(injected.toString())) {
    fail.push('STUB is ' + STUB + 's and the stubbed post in injected() answers at a different '
      + 'time — the check mark would not land on the word the send is timed to');
  }

  /* the last step is filled field by field, on camera, and every field the
     script names is one the run actually typed into. */
  for (const f of FIELDS) {
    const got = (state.fills || []).find(x => x.id === f.id);
    if (!got) fail.push('the field ' + f.id + ' was never filled');
    else if (got.got === 'no field') fail.push('the field ' + f.id + ' was not on the page when it was named');
  }
  if (/[0-9]/.test(LINES.map(l => l.text).join(' '))) {
    fail.push('a digit reached the script, and the registration number is named and never read');
  }

  /* the comedy read. it is over the typing or it is over nothing, and it is not
     allowed to run past the last keystroke into the beat where the form is being
     finished, because that beat belongs to the taps. */
  if (!joke || !joke.words.length) fail.push('the comedy line has no timings, so it was never laid down');
  else {
    if (joke.voice !== JOKE.voice) fail.push('the comedy line was read by ' + joke.voice);
    if (VOICES[joke.voice] && !VOICES[joke.voice].comedy) {
      fail.push('"' + joke.voice + '" is not marked as a comedy voice, so this line is being read by a narrator');
    }
    if (joke.text !== TYPED.replace(/\s+/g, ' ').trim()) {
      fail.push('the comedy line reads "' + joke.text + '" and the field types "' + TYPED + '"');
    }
    if (joke.at.from < site.typing.from - 0.12) {
      fail.push('the comedy read starts ' + (site.typing.from - joke.at.from).toFixed(2)
        + 's before the first keystroke');
    }
    if (joke.at.to > site.typing.to + 0.20) {
      fail.push('the comedy read runs ' + (joke.at.to - site.typing.to).toFixed(2)
        + 's past the last keystroke, into the beat the form is finished in');
    }
  }

  /* the sound the typing and the send were missing */
  if (site.keys.length < 6) fail.push('only ' + site.keys.length + ' key ticks under the typing');
  if (!cues.some(c => c.kind === 'press')) fail.push('the send tap has no press on it');
  if (!cues.some(c => c.kind === 'ding' && Math.abs(c.t - site.confirmAt) < 1e-6)) {
    fail.push('nothing sounds on the frame the check mark is drawn');
  }

  /* the typed line, and whether anybody can read it */
  if (!state.typedInk) fail.push('the typed line was never read back off the field');
  else {
    if (state.typedInk.text !== TYPED) {
      fail.push('the field holds "' + state.typedInk.text + '" and the script says "' + TYPED + '"');
    }
    /* the floor here is deliberately **not** the caption's 32. that number is
       for one short line read at a glance out of a feed, in the brand's own
       display type, and borrowing it for a form field would be borrowing a
       number from the wrong thing: this is the site's own body text, filmed at
       roughly the size a phone renders it at, and it is legible for exactly the
       reason the site is legible. 18 is where a filmed ui stops reading at all.
       the run prints the real number and the review looks at it. */
    if (state.typedInk.capPx < 18) {
      fail.push('the typed line renders at ' + state.typedInk.capPx
        + ' device px of cap, which is under the 18 a filmed interface needs');
    }
  }

  /* the end card: three stacked lines and the address, centred as a group in the
     room above the caption band, and it has to stay out of that band. */
  if (!state.built.end) fail.push('the end card never reported where it placed itself');
  else {
    const e = state.built.end;
    if (e.bottom > state.ceiling.top - 20) {
      fail.push('the end card reaches ' + e.bottom.toFixed(1) + ' and the caption ceiling is '
        + state.ceiling.top + ' — the address would sit on the last line of the clip');
    }
    if (e.top * DSF < SAFE.top - 0.5) {
      fail.push('the end card starts ' + Math.round(e.top * DSF) + ' device px down, floor is ' + SAFE.top);
    }
    if (e.wordmark < 2.4 * state.built.wordmarkPx) {
      fail.push('the wordmark measured ' + e.wordmark + 'px tall at ' + state.built.wordmarkPx
        + 'px of type, which is not three lines');
    }
  }

  /* ---------- can any of it be read, on whichever page this is ----------
     four things carry meaning as ink and they are held to CONTRAST_MIN on both
     themes: the caption, the bubble's outline against the capsule it draws, the
     end card and the tap ring.

     **two are measured and deliberately not floored, and the reason is the
     point.** the card's hairline is `var(--line)`, index.html's own separator,
     which is faint on purpose on both themes — it is not a boundary anything
     depends on, because the card is full of the site and the site is the
     boundary. and the bubble's fill is the page colour by design: it is a
     capsule with a hole in it and the **outline** is what separates it, which is
     the number above. flooring either would mean restyling the site inside the
     card for the film, which is the one thing this file has never done.

     what they get instead is **parity**: whatever the light render measured,
     the dark one has to match or beat. the light state is on disk next to this
     one, so a theme swap that quietly made anything fainter fails even where
     there is no absolute number to fail against. */
  if (!state.contrast) fail.push('nothing measured what any of it is painted against');
  else {
    const c = state.contrast;
    if (c.theme !== THEME) fail.push('the page came up ' + c.theme + ' and the render is ' + THEME);
    const INK = [
      ['the caption ink', 'caption.ratio'],
      ['the bubble outline against its own capsule', 'bubble.ratio'],
      ['the end card wordmark', 'endcard.ratio'],
      ['the end card address', 'endcard.subRatio'],
      ['the tap ring', 'ring.ratio'],
      ['the opening type', 'scene.ratio'],
      /* the orange is the only colour in the clip that is not the page's own
         ink or its own paper, so it is the only one that could be readable on
         one theme and a smudge on the other. it is held to the same absolute bar
         on both rather than to a parity, because it is one hard coded value and
         there is nothing for a parity to compare it against. */
      ['the orange faces', 'orange.ratio'],
    ];
    /* the parity check covers **only** these two, and that is the whole of its
       job. the five above already clear an absolute bar by four or five times,
       and comparing them across themes measures nothing but the fact that near
       black on white is a bigger number than off white on near black, which is
       the site's own token pair and not a degradation. these two have no
       absolute bar to clear, so the light render is the only thing there is to
       hold them to. */
    const PAIRED = [
      ['the card hairline', 'hairline.ratio'],
      ['the bubble capsule against the page', 'bubble.onPage'],
    ];
    const at = (o, path2) => path2.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
    for (const [what, key] of INK) {
      const got = at(c, key);
      if (!(got >= CONTRAST_MIN)) {
        fail.push(what + ' is ' + got + ':1 on the ' + c.theme + ' page, floor is ' + CONTRAST_MIN);
      }
    }
    /* and against the light render, when there is one to compare with. */
    if (THEME === 'dark') {
      const lightState = path.join(OUT, 'post11-light-1080x1920.json');
      if (!fs.existsSync(lightState)) {
        console.log('    (no light render on disk, so nothing to hold the dark one against)');
      } else {
        const lc = (JSON.parse(fs.readFileSync(lightState, 'utf8')) || {}).contrast;
        if (!lc) console.log('    (the light render predates the contrast probe)');
        else {
          /* the faces are the same orange on both pages, and that is not a
             preference: a character who changes colour with the theme is two
             characters. it is compared as the resolved colour rather than as the
             token, so a theme block that quietly overrode it would be caught. */
          if (lc.orange && lc.orange.ink !== c.orange.ink) {
            fail.push('the faces are ' + c.orange.ink + ' on dark and ' + lc.orange.ink
              + ' on light, and the orange is meant to be one colour on both');
          }
          for (const [what, key] of PAIRED) {
            const a = at(lc, key), b = at(c, key);
            if (a == null || b == null) continue;
            if (b < a - 0.05) {
              fail.push(what + ' is ' + b + ':1 on dark against ' + a + ':1 on light, '
                + 'so the theme swap made it fainter');
            }
          }
        }
      }
    }
  }

  /* the mascot's own report */
  for (const st of rep.states) {
    if (st.entryFrames == null) fail.push(st.state + ' never reached its own mark');
    else if (st.entryFrames < 3) fail.push(st.state + ' arrives in ' + st.entryFrames + ' frames, which is a cut');
  }
  if (rep.outside.units > 0) {
    fail.push('feature ink lands ' + rep.outside.units.toFixed(2) + ' units outside the head at '
      + rep.outside.at.toFixed(2) + 's');
  }
  if (rep.blinks.repeatsInARow) fail.push(rep.blinks.repeatsInARow + ' blinks repeat the one before them');
  if (rep.frozenFrames) fail.push(rep.frozenFrames + ' frames where the face is not moving at all');
  if (rep.maxSquash > 0.08 + 1e-6) fail.push('the squash reached ' + (rep.maxSquash * 100).toFixed(1) + '%');
  if (rep.maxBreathe >= 0.02) fail.push('breathing reached ' + (rep.maxBreathe * 100).toFixed(2) + '%');

  /* the mix */
  if (!under.windows) fail.push('no window where a word is being spoken, so the bus was never judged');
  if (under.over.length) {
    fail.push(under.over.length + ' windows where the bus is over the voice, first at '
      + under.over[0].t + 's');
  }
  if (!after.ok) fail.push('the loudness meter did not run');
  else {
    if (Math.abs(after.lufs - TARGET_LUFS) > 1.0) {
      fail.push(after.lufs.toFixed(1) + ' LUFS delivered, wanted ' + TARGET_LUFS);
    }
    if (after.truePeak != null && after.truePeak > PEAK_CEILING + 0.1) {
      fail.push('true peak is ' + after.truePeak.toFixed(1) + ' dBTP, ceiling is ' + PEAK_CEILING);
    }
  }
  if (lim.reduction > 9) {
    fail.push('the limiter pulled ' + lim.reduction.toFixed(1)
      + ' dB, which is squashing rather than limiting');
  }

  /* the copy. no dash anywhere a viewer can read one, in any language, and that
     covers the script, the typed line, the bubbles and the end card. */
  const readable = [...LINES.map(l => l.text), TYPED, 'the boring tek', 'theboringtek.com',
    ...SAY_AS.map(x => x.draw), ...FIELDS.map(f => f.text),
    /* every bubble, whichever spelling asked for it. it used to read the runs
       only, which was correct while every bubble a viewer saw was in one, and
       stopped being correct the moment the opening grew two of its own. */
    ...mas.marks.flatMap(m => (m.bubbles || []).map(b => b.text)),
    /* and the opening, which is four scenes of type a viewer reads. */
    ...SCENES.flatMap(s => s.lines.map(l => l.t))];
  for (const s of readable) {
    if (/[—–]/.test(s) || /\s-\s/.test(s)) fail.push('a punctuation dash in: "' + s + '"');
  }
  return fail;
}

main().catch(e => { console.error(e); process.exit(1); });
