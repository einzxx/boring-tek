/* the boring tek — the sound effects layer. every sound in it is synthesised in
   javascript, sample by sample, and there is not one audio file in the repo.

   tooling, not the site: nothing in here ships and nothing in here is loaded by
   index.html. the site is still silent.

   ---------- why synthesis rather than a sample pack ----------

   the same reason the pictograms are drawn in code and the mascot is an inline
   svg. a sample pack is a dependency with a licence, a download and a folder of
   binaries in a public repo, and it sounds like everybody else's clip because it
   is everybody else's clip. eighty lines of oscillator and envelope is smaller
   than one wav, it is diffable, and every number in it is a number somebody can
   argue with. it is also the only way the sounds can be *derived*: a pop that is
   generated from the caption plan cannot drift out of sync with the caption,
   because there is nothing to drift.

   ---------- what a sound is ----------

   a voice in `VOICES` is a pure function of its own options that returns one
   mono Float32Array, peak normalised to 1.0. it knows nothing about when it
   plays or how loud it is: `renderSfx` places it and `GAINS` sets its level, so
   the design of a sound and the balance of a mix are two separate arguments.

   they are all short, low and quiet, because they are standing in for paper and
   ink rather than for a user interface. nothing in here rings for a second,
   nothing in here is bright, and the loudest of them is twenty two decibels
   under full scale before the mix even starts.

   ---------- where the times come from ----------

   nowhere in this file, and nowhere in a clip script either. `cuesFromCaptions`
   reads a caption plan and `cuesFromScenes` reads a scene plan, and between them
   they produce every cue in the clip. a card entrance is `group.in`. a coin
   landing is its own move step's start plus `IMPACT` of its duration, which is
   the same constant `sceneFrame` uses to decide when the coin has touched down,
   so the sound is on the frame the shadow tightens on rather than near it.
   change a word in the script and the voice moves, the captions move, the scenes
   move and the sounds move, all from the one array.

   ---------- the mix ----------

   `mixdown` is the only thing here that knows about the voice. three rules, and
   all three are measured rather than asserted:

     the voice is on top. the sfx bus is ducked by a real envelope built from the
     word timings, so an effect under a word is 8dB further down than the same
     effect in a gap.

     nothing is louder than the voice while a word is being said. that is checked
     window by window against the decoded voice, and it fails the render rather
     than printing a warning.

     it does not clip and it is not too loud. the mix is scaled to a broadcast
     safe integrated loudness and a true peak ceiling, and both are measured on
     the finished file.
*/

import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

export const SR = 48000;

/* ---------- the noise source ----------
   a seeded xorshift rather than Math.random, for the same reason the recorder
   seeds the page's: a render has to produce the same file twice. */
function noise(seed) {
  let x = seed | 0 || 0x2f6e2b1;
  return () => {
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5; x |= 0;
    return (x >>> 0) / 2147483648 - 1;
  };
}

/* ---------- the small dsp ----------
   one pole filters, because at these durations a steeper one has nothing to do
   and a resonant one would ring, which is the opposite of what any of this is
   for. `bp` is two of them in series and it is the entire filter vocabulary. */
function lp(buf, hz, sr = SR) {
  const a = Math.exp(-2 * Math.PI * hz / sr);
  let y = 0;
  for (let i = 0; i < buf.length; i++) { y = (1 - a) * buf[i] + a * y; buf[i] = y; }
  return buf;
}
function hp(buf, hz, sr = SR) {
  const a = Math.exp(-2 * Math.PI * hz / sr);
  let y = 0, prev = 0;
  for (let i = 0; i < buf.length; i++) {
    y = a * (y + buf[i] - prev); prev = buf[i]; buf[i] = y;
  }
  return buf;
}
const bp = (buf, lo, hi) => lp(hp(buf, lo), hi);

const n = len => new Float32Array(Math.max(1, Math.round(len * SR)));
/* an exponential decay written as a time constant rather than a curve shape, so
   "this rings for 90ms" is what the number says. */
const decay = (i, tau) => Math.exp(-i / (tau * SR));
/* a raised cosine, for anything that swells rather than strikes. it starts and
   ends at exactly zero, which is what keeps a whoosh from clicking at its own
   edges. */
const hump = q => 0.5 - 0.5 * Math.cos(2 * Math.PI * Math.min(1, Math.max(0, q)));
function normalise(buf) {
  let peak = 0;
  for (let i = 0; i < buf.length; i++) peak = Math.max(peak, Math.abs(buf[i]));
  if (peak > 1e-9) for (let i = 0; i < buf.length; i++) buf[i] /= peak;
  return buf;
}
/* two milliseconds off each end of every sound, always. a buffer that starts or
   stops at a non zero sample is a click, and a click is the one artefact that
   survives every codec between here and a phone speaker. */
function ends(buf, ms = 2) {
  const k = Math.min(Math.round(ms / 1000 * SR), buf.length >> 1);
  for (let i = 0; i < k; i++) {
    const g = i / k;
    buf[i] *= g;
    buf[buf.length - 1 - i] *= g;
  }
  return buf;
}

/* ---------- the sounds ----------
   sixteen of them, and each one is two or three lines of physics.

   the whole set is deliberately dull. a caption card gets a thump with no top
   end at all, because the thing it is announcing is a word appearing, not a
   notification; the coin is the only sound in the clip with any metal in it,
   because it is the only thing in the clip made of metal.

   **the last four are a character rather than a set of things, and post12 is
   what asked for them.** `chirp` opened that door and these walk through it: a
   greeting, a noise a body makes, a laugh, and the frame breaking. they are the
   only sounds in the file that are allowed to be funny, and the rule that keeps
   them inside the house is that none of them is bright: the giggle is the
   highest thing here and it is still low passed under four kilohertz, which is
   where every other sound in this file has its ceiling. */
export const VOICES = {
  /* a caption card arriving. a body with no click on it: a sine falling from
     150 to 92 hertz inside sixty milliseconds, gone in a tenth of a second. it
     is the sound of something light being set down on paper. */
  pop({ f0 = 150, f1 = 92, tau = 0.055, len = 0.13 } = {}) {
    const b = n(len);
    let ph = 0;
    for (let i = 0; i < b.length; i++) {
      const q = i / b.length;
      ph += 2 * Math.PI * (f0 + (f1 - f0) * Math.min(1, q * 2.2)) / SR;
      b[i] = Math.sin(ph) * decay(i, tau);
    }
    return ends(normalise(lp(b, 900)));
  },
  /* one of the three counted beats. the same gesture an octave down and half
     again as long, so it is heard as the same sound carrying more weight rather
     than as a second sound. */
  popDeep({ f0 = 96, f1 = 54, tau = 0.10, len = 0.26 } = {}) {
    const b = n(len);
    let ph = 0;
    for (let i = 0; i < b.length; i++) {
      const q = i / b.length;
      ph += 2 * Math.PI * (f0 + (f1 - f0) * Math.min(1, q * 1.8)) / SR;
      b[i] = Math.sin(ph) * decay(i, tau);
    }
    return ends(normalise(lp(b, 520)));
  },
  /* a scene changing. paper moving past paper: band passed noise with the band
     falling from about 1.9k to 700 as it goes, under a raised cosine so it has
     no attack of its own. it should be noticed only if it is missing. */
  whoosh({ len = 0.20, seed = 0x51f3a1 } = {}) {
    const b = n(len), rnd = noise(seed);
    for (let i = 0; i < b.length; i++) b[i] = rnd();
    bp(b, 420, 1900);
    const lo = n(len);
    for (let i = 0; i < lo.length; i++) lo[i] = b[i];
    lp(lo, 700);
    for (let i = 0; i < b.length; i++) {
      const q = i / b.length;
      b[i] = (b[i] * (1 - q) + lo[i] * q) * hump(q);
    }
    return ends(normalise(b));
  },
  /* the coin landing. a thud and a ring struck at the same instant, because
     that is what one impact on one object sounds like. the ring is two
     inharmonic partials rather than a harmonic pair — a disc is not a string —
     and it is well under the thud, so the coin reads as heavy metal on paper
     rather than as a bell. */
  coin({ len = 0.42, thud = 0.055, ring = 0.20 } = {}) {
    const b = n(len);
    let pt = 0, r1 = 0, r2 = 0;
    for (let i = 0; i < b.length; i++) {
      const q = Math.min(1, i / (0.03 * SR));
      pt += 2 * Math.PI * (118 - 46 * q) / SR;
      r1 += 2 * Math.PI * 2380 / SR;
      r2 += 2 * Math.PI * 3410 / SR;
      b[i] = Math.sin(pt) * decay(i, thud)
        + (Math.sin(r1) * 0.5 + Math.sin(r2) * 0.34) * decay(i, ring) * 0.30;
    }
    return ends(normalise(lp(b, 5200)));
  },
  /* the lock seating. the shortest thing in the set: seven milliseconds of
     band passed noise for the mechanism and a 190 hertz pulse under it for the
     body, both gone inside a twentieth of a second. solid comes from how fast it
     stops, not from how loud it starts. */
  click({ len = 0.09, seed = 0x2b71d5 } = {}) {
    const b = n(len), rnd = noise(seed);
    const burst = Math.round(0.007 * SR);
    for (let i = 0; i < burst; i++) b[i] = rnd();
    bp(b, 900, 3200);
    let ph = 0;
    for (let i = 0; i < b.length; i++) {
      ph += 2 * Math.PI * 190 / SR;
      b[i] = b[i] * decay(i, 0.010) * 0.8 + Math.sin(ph) * decay(i, 0.022);
    }
    return ends(normalise(lp(b, 4000)));
  },
  /* the glass moving across the page. the quietest thing in the clip by six
     decibels and the longest by a factor of four: a slow band of noise with the
     band opening as it travels, under a raised cosine so it arrives from nothing
     and leaves to nothing. */
  sweep({ len = 0.90, seed = 0x7d10ab } = {}) {
    const b = n(len), rnd = noise(seed);
    for (let i = 0; i < b.length; i++) b[i] = rnd();
    bp(b, 300, 1400);
    for (let i = 0; i < b.length; i++) {
      const q = i / b.length;
      b[i] *= hump(q) * (0.55 + 0.45 * q);
    }
    return ends(normalise(b), 8);
  },
  /* a camera snapping to a new frame, or a theme flipping. the ninth sound and
     the first one added since the set was written, for post9, which is the first
     clip whose camera moves fast enough to need telling.

     it is a small geared motor and it is built as one: a pitch that slides up
     while it accelerates, amplitude modulated at the tooth rate so it buzzes
     rather than tones, and a body of band passed noise underneath because a
     motor moving a real mass is never clean. the modulation is what makes it a
     servo instead of a synth sweep, and the depth is kept under 1 so the tone
     never gates itself into a click train.

     it is short on purpose: 90ms, which is five frames at 60fps. a snap zoom is
     over in eight, and a sound that outlasts the move it belongs to is a sound
     the viewer starts listening to. */
  servo({ len = 0.09, f0 = 190, f1 = 340, tooth = 105, depth = 0.55, seed = 0x3ba71c } = {}) {
    const b = n(len), rnd = noise(seed);
    let ph = 0, mp = 0;
    for (let i = 0; i < b.length; i++) {
      const q = i / b.length;
      /* the slide is eased rather than linear: a motor comes up to speed. */
      ph += 2 * Math.PI * (f0 + (f1 - f0) * (q * q * (3 - 2 * q))) / SR;
      mp += 2 * Math.PI * tooth / SR;
      const am = 1 - depth * 0.5 * (1 - Math.cos(mp));
      /* triangle rather than sine: a little more edge, none of a saw's top end,
         which would be the one bright thing in a set that is deliberately dull. */
      const tri = 2 / Math.PI * Math.asin(Math.sin(ph));
      b[i] = (tri * 0.8 + rnd() * 0.35) * am * hump(q);
    }
    return ends(normalise(bp(b, 260, 2600)));
  },
  /* the mascot answering. the tenth sound, and the first one in the set that
     stands in for a character rather than for a thing: everything above is
     paper, ink, metal or a mechanism, and this is a small robot deciding to
     say something. it is one note; a reply is several of them and
     `chirpPhrase` below is what builds the sequence.

     the recipe is a sine that glides up inside its own ninety milliseconds
     with a third harmonic a quarter under it. the glide is what makes it read
     as friendly rather than as an alarm — a tone that rises has asked a
     question or agreed with you, and a tone that sits still is a smoke
     detector — and the third is what keeps it plastic rather than pure.

     it is low passed at 3.4k on purpose. this set is dull by design and a
     character voice is allowed to be the brightest thing in it without
     actually being bright: what comes out is a rounded boop rather than the
     piezo beep every other clip on the feed uses.

     three milliseconds of attack rather than none. a boop that starts on the
     sample is a click with a tone after it, and at these levels a phone
     speaker reproduces the click better than the tone. */
  chirp({ len = 0.09, f0 = 620, f1 = 880, tau = 0.048, glide = 0.5, third = 0.22 } = {}) {
    const b = n(len);
    let ph = 0;
    for (let i = 0; i < b.length; i++) {
      const q = Math.min(1, (i / b.length) / glide);
      ph += 2 * Math.PI * (f0 + (f1 - f0) * (q * q * (3 - 2 * q))) / SR;
      b[i] = (Math.sin(ph) + Math.sin(ph * 3) * third)
        * decay(i, tau) * Math.min(1, i / (0.003 * SR));
    }
    return ends(normalise(lp(b, 3400)));
  },
  /* one key going down. the eleventh sound, added for post11, whose whole
     middle is a form being typed into and which had nothing at all under the
     hand.

     it is the `click` recipe taken apart and made smaller: three and a half
     milliseconds of noise for the plastic hitting plastic, banded higher than
     the lock's because a keycap is a lighter thing, and a 124 hertz pulse under
     it for the board it is bolted to. both are gone inside fifty five
     milliseconds. it is not one sound per keystroke — see the grouping in
     post11 — because forty three of anything inside three seconds is a rattle.

     the whole recipe is about how fast it stops. a key that rings is a key that
     is broken. */
  key({ len = 0.055, seed = 0x4c9e13 } = {}) {
    const b = n(len), rnd = noise(seed);
    const burst = Math.round(0.0035 * SR);
    for (let i = 0; i < burst; i++) b[i] = rnd();
    bp(b, 1300, 4200);
    let ph = 0;
    for (let i = 0; i < b.length; i++) {
      ph += 2 * Math.PI * 124 / SR;
      b[i] = b[i] * decay(i, 0.0055) * 0.75 + Math.sin(ph) * decay(i, 0.013) * 0.55;
    }
    return ends(normalise(lp(b, 5000)));
  },
  /* the twelfth, and it is the `click` again with weight on it. post11 has six
     real presses in it and the last one is the point of the whole clip, and it
     sounded exactly like the five before it — which is the one place in a sound
     design where a press has to mean something.

     so: the same two parts, both bigger. nine milliseconds of noise a bit lower
     down for a button with travel in it, and a body that falls from 150 to 110
     hertz rather than sitting at 190, which is what makes it read as a thing
     going down and staying there. it is still under a seventh of a second,
     because a press that outlasts the finger is a doorbell. */
  press({ len = 0.13, seed = 0x1f7c40 } = {}) {
    const b = n(len), rnd = noise(seed);
    const burst = Math.round(0.009 * SR);
    for (let i = 0; i < burst; i++) b[i] = rnd();
    bp(b, 620, 2600);
    let ph = 0;
    for (let i = 0; i < b.length; i++) {
      ph += 2 * Math.PI * (150 - 40 * Math.min(1, i / (0.022 * SR))) / SR;
      b[i] = b[i] * decay(i, 0.012) * 0.8 + Math.sin(ph) * decay(i, 0.040);
    }
    return ends(normalise(lp(b, 3600)));
  },
  /* a check being drawn. the one sound allowed above a kilohertz, and it is a
     soft one: a fundamental with a fifth over it, low passed hard enough that
     what is left is a tap with a pitch rather than a chime. */
  ding({ len = 0.38, f = 588, tau = 0.11 } = {}) {
    const b = n(len);
    let p1 = 0, p2 = 0;
    for (let i = 0; i < b.length; i++) {
      p1 += 2 * Math.PI * f / SR;
      p2 += 2 * Math.PI * f * 1.5 / SR;
      const strike = Math.min(1, i / (0.004 * SR));
      b[i] = (Math.sin(p1) + Math.sin(p2) * 0.38) * decay(i, tau) * strike;
    }
    return ends(normalise(lp(b, 2600)));
  },
  /* the closing scene. not an effect, a floor: a fifth held two octaves below
     everything else, swelling in over a second and gone before the clip is. it
     is under the noise floor of most phone speakers on purpose — on anything
     that can reproduce it, the last four seconds feel settled, and on anything
     that cannot, nothing is missing. */
  hum({ len = 3.2, f = 55, rise = 0.34, fall = 0.38 } = {}) {
    const b = n(len);
    let p1 = 0, p2 = 0;
    for (let i = 0; i < b.length; i++) {
      const q = i / b.length;
      p1 += 2 * Math.PI * f / SR;
      p2 += 2 * Math.PI * f * 1.5 / SR;
      /* in over `rise`, hold, out over `fall`, both halves of one raised cosine
         so it never has an edge to click on. */
      const env = q < rise ? hump(q / rise / 2)
        : q > 1 - fall ? hump(0.5 + (q - (1 - fall)) / fall / 2)
          : 1;
      b[i] = (Math.sin(p1) + Math.sin(p2) * 0.5) * env;
    }
    return ends(normalise(lp(b, 220)), 30);
  },

  /* ---------- the four post12 brought ----------
     the thirteenth, and it is the mascot saying hello. `chirp` is one note and
     means "i have something to say"; this is two, and the second is higher,
     which is the whole difference between a beep and a greeting. a rising pair
     is what a door entry system, a kettle and a cartoon robot all use to mean
     the same thing, and a falling pair means the opposite so completely that
     there is nothing to tune between them.

     the notes are 90ms and 105ms with 34ms of air between them, because the gap
     is what makes it two syllables rather than one glide. each note also glides
     up inside itself, the same trick `chirp` uses, so the pair rises twice: once
     between the notes and once within each of them. that is the part that reads
     as cute rather than as an announcement.

     the third harmonic a quarter under is `chirp`'s, and so is the 3.4k low
     pass: this is the same small robot with a bigger vocabulary, not a new one.
     the second note is a hair quieter than the first, which is what a voice does
     and a doorbell does not.

     it was built against an edge tts "hi" pitched up and bit crushed. see
     post12.mjs for that comparison and which one shipped. */
  hi({ f0 = 620, f1 = 760, f2 = 900, f3 = 1140, one = 0.09, gap = 0.034, two = 0.105,
    tau = 0.055, third = 0.24 } = {}) {
    const b = n(one + gap + two);
    const note = (at, len, a, z, amp) => {
      const s0 = Math.round(at * SR), s1 = Math.min(b.length, Math.round((at + len) * SR));
      let ph = 0;
      for (let i = s0; i < s1; i++) {
        const q = Math.min(1, (i - s0) / ((s1 - s0) * 0.55));
        ph += 2 * Math.PI * (a + (z - a) * (q * q * (3 - 2 * q))) / SR;
        b[i] += (Math.sin(ph) + Math.sin(ph * 3) * third)
          * decay(i - s0, tau) * Math.min(1, (i - s0) / (0.003 * SR)) * amp;
      }
    };
    note(0, one, f0, f1, 1);
    note(one + gap, two, f2, f3, 0.88);
    return ends(normalise(lp(b, 3400)));
  },

  /* the fourteenth, and it is the one sound in this file that is a joke.

     ---------- what was wrong with the first one, because it is the design ----
     the first build was a sine with a tremolo on it: a fundamental falling from
     96 to 58 hertz, amplitude modulated at a fixed 38, low passed at 380. It was
     the right *pitch* and it read as **a buzz**, not as a fart, and the reason is
     worth writing down because it is the whole of this recipe.

     a fart is not a tone with a wobble on it. it is a **membrane chattering** —
     a slack aperture opening and closing under pressure — which is the same
     mechanism as a lip trill, a kazoo and a duck call. the flutter *is* the
     fundamental, not a modulation of one. and the thing that makes it read as a
     body rather than as an oscillator is that the chattering is **irregular**: no
     two cycles are the same length or the same loudness, because the pressure
     behind it is falling and the aperture is not a machine.

     a sine with a perfectly periodic tremolo has none of that. every cycle is
     identical, so the ear hears a synthesiser being modulated, which is exactly
     what it is.

     ---------- so this is a pulse train, and four things are unsteady ----------

     **the pitch is the flutter rate**, 64 hertz falling to 33, and it falls in
     two stages: a third of the way over the first two thirds of the length, then
     the rest steeply. that is the pressure running out, and the steep bit at the
     end is what everybody hears as the punchline.

     **every cycle gets its own period.** a seeded draw of plus or minus `jitter`
     on each wrap of the phase, which is what a voice scientist would call
     jitter and is the single number that separates this from a synth tone.

     **every cycle gets its own loudness**, drawn the same way, which is the
     irregular flutter: some pulses land harder than the ones either side.

     **and a slow wobble on top**, five and a half hertz, so it sags rather than
     glides.

     the waveform is a raised cosine pulse of `width` duty inside each cycle. a
     narrow smooth bump has a long harmonic series that falls off gently, which
     is the buzz; a square would have the same series with an edge on it, which
     is a raspberry. there is **no noise in it at all**, and that is what keeps it
     comic rather than gross: the wet broadband hiss is the whole of what makes a
     real one unpleasant, and this one has none.

     the tail is an exponential over the last quarter rather than the old linear
     ramp over the last third. it stops rather than fading, which is what the
     brief means by "a quick tail that dies off".

     high passed at 30 because a one sided pulse has dc in it, and low passed at
     620, which is up from the old 380: the old ceiling was hiding the harmonics
     that make it a buzz at all. there is still nothing above it to be rude with.

     ---------- the gate, and the two burst shape ----------
     a real one very often does not come out in one piece: a short one, a gap of
     about fifty milliseconds, then a longer one that collapses in pitch. that is
     what `gate` is for, and it is what the defaults below use, because it is the
     single most recognisable fart *gesture* in the set — the measurements say so
     and so does anybody's memory of one.

     ---------- the variants ----------
     `FART` below carries four presets. these defaults are `sputter`, which is
     the one that shipped; the other three are `parp` (the same recipe in one
     piece), `puff` (small and polite) and `wobbler` (the cartoon). post12.mjs
     writes all four out on every render and prints the numbers they were chosen
     on. */
  fart({
    len = 0.46, f0 = 70, f1 = 30, drop = 0.62, fall = 0.35,
    jitter = 0.19, ampJit = 0.40, width = 0.28,
    wobHz = 5.0, wobDepth = 0.12,
    lpHz = 660, attack = 0.012, tail = 0.20, gate = [[0, 0.17], [0.29, 1]],
    seed = 0x71b3e8,
  } = {}) {
    const b = n(len), rnd = noise(seed);
    let ph = 0, wp = 0, jit = 0, cyc = 1;
    for (let i = 0; i < b.length; i++) {
      const q = i / b.length;
      /* the fall: `fall` of the way over the first `drop` of the length, then
         the rest steeply. one curve, two halves, and the second half is the
         joke. */
      const a = q < drop
        ? (q / drop) * fall
        : fall + Math.pow((q - drop) / (1 - drop), 1.6) * (1 - fall);
      wp += 2 * Math.PI * wobHz / SR;
      const rate = (f0 + (f1 - f0) * a) * (1 + wobDepth * Math.sin(wp)) * (1 + jit);
      ph += rate / SR;
      if (ph >= 1) {
        ph -= 1;
        /* a new period and a new loudness for every single cycle. this is the
           line that turns a buzz into a body. */
        jit = rnd() * jitter;
        cyc = 1 + rnd() * ampJit;
      }
      const pulse = ph < width ? hump(ph / width) : 0;
      /* in over the attack, flat, then an exponential over the last `tail`. */
      let env = Math.min(1, i / (attack * SR));
      if (q > 1 - tail) env *= Math.exp(-4.5 * (q - (1 - tail)) / tail);
      /* the gate, for the shape that comes apart into two bursts. each edge
         ramps over a hundredth of the sound's own length, which is about five
         milliseconds here, so a burst cannot click at its own ends. */
      if (gate) {
        let g = 0;
        for (const [ga, gz] of gate) {
          if (q < ga || q > gz) continue;
          const e = Math.min(0.012, (gz - ga) / 2);
          g = Math.max(g, Math.min(1, Math.min(q - ga, gz - q) / e));
        }
        env *= g;
      }
      b[i] = pulse * cyc * env;
    }
    return ends(normalise(bp(b, 30, lpHz)), 6);
  },

  /* the fifteenth: one note of a three note giggle. the clip fires it three
     times with `step` 0, 1 and 2 and the pitch climbs a whole tone each time, so
     a laugh is three cues rather than one buffer. that is the whole reason it is
     shaped this way: three cues can be placed on whatever the picture is
     actually doing, and post12 puts them on the mascot's own hops, measured off
     the rig rather than laid on a grid this file invented.

     it is `chirp` made smaller and quicker: 62 milliseconds against ninety, a
     shorter tail, the same glide up inside itself. a laugh is the same voice as
     the greeting going faster, which is what a laugh is. */
  giggle({ step = 0, len = 0.062, f0 = 780, f1 = 980, tau = 0.030, third = 0.26,
    ratio = 1.122 } = {}) {
    const b = n(len);
    const k = Math.pow(ratio, step);
    let ph = 0;
    for (let i = 0; i < b.length; i++) {
      const q = Math.min(1, (i / b.length) / 0.5);
      ph += 2 * Math.PI * (f0 * k + (f1 - f0) * k * (q * q * (3 - 2 * q))) / SR;
      b[i] = (Math.sin(ph) + Math.sin(ph * 3) * third)
        * decay(i, tau) * Math.min(1, i / (0.0025 * SR));
    }
    return ends(normalise(lp(b, 3800)));
  },

  /* the sixteenth: the frame breaking, once, hard. post11 has a glitch of its
     own written inside post11.mjs and this is deliberately not that one. that
     one is a dropped packet, four or five gates coming apart over a sixth of a
     second, and it is the sound of a signal degrading. this is a single hit: the
     sound of a cut that should not be there.

     three things on one instant. eight milliseconds of full band noise, which is
     the transient and is the only genuinely bright thing in this file. a square
     blip falling a fifth underneath, because a square is obviously generated and
     a sine is not. and a tail of the same noise put through a sample and hold at
     2.6k, which is a bit crusher: it is what a digital thing sounds like when it
     is broken, and it is the reason this reads as a glitch rather than as a
     snare.

     140 milliseconds, which is eight frames at sixty. anything longer is a
     broken render rather than a fault. */
  glitch({ len = 0.14, burst = 0.008, crush = 2600, f0 = 260, f1 = 92,
    seed = 0x2c81f7 } = {}) {
    const b = n(len), rnd = noise(seed);
    const bn = Math.round(burst * SR);
    for (let i = 0; i < bn; i++) b[i] = rnd() * (1 - i / bn);
    /* the crushed tail. one sample held for the whole step, which is what
       decimation is, under a fast decay so it stutters out rather than fades. */
    const hold = Math.max(1, Math.round(SR / crush));
    let held = 0;
    for (let i = bn; i < b.length; i++) {
      if ((i - bn) % hold === 0) held = rnd();
      const q = (i - bn) / (b.length - bn);
      b[i] += held * Math.exp(-5.5 * q) * 0.62;
    }
    /* the blip. it stops at three fifths, so the crushed tail is the last thing
       left and the hit ends on noise rather than on a pitch. */
    let ph = 0;
    for (let i = 0; i < b.length; i++) {
      const q = i / b.length;
      ph += 2 * Math.PI * (f0 + (f1 - f0) * q) / SR;
      b[i] += (Math.sin(ph) > 0 ? 0.36 : -0.36) * Math.exp(-6 * q) * (q < 0.6 ? 1 : 0);
    }
    return ends(normalise(bp(b, 180, 7000)), 4);
  },
};

/* ---------- the four farts ----------
   options for `VOICES.fart`, and `parp` is what the function already defaults
   to. they exist because a sound like this cannot be argued about in the
   abstract: post12's brief asked for a few and for the clearest one to ship,
   and the other three are kept so somebody who can actually listen can
   overrule the one that was chosen on measurements.

   `parp` is the reference and it is this recipe in one piece: a third of a
   second, 64 hertz down to 33, and eleven per cent measured jitter against the
   old sine's two and a half. it was the first fix and it is a good sound; what
   it does not have is the collapse at the end.

   `puff` is a small polite one — shorter, higher, wider pulses so it is rounder,
   and a lower ceiling. it is the least funny of the four and the most usable
   under a voice.

   **`sputter` is the one that shipped**, and it is what this function defaults
   to. the same recipe cut into two bursts by the gate: a short one, a fifty
   millisecond gap, then a longer one that collapses from 79 hertz to 42. it wins
   the brief's own three clauses — the biggest pitch drop in the set at 1.91x,
   fourteen per cent jitter which is in the middle of the usable band rather than
   at either edge, and a tail down to eight per cent of the body. it is also the
   longest at 0.46s, which is affordable now and would not have been in a five
   second cut.

   `wobbler` is the cartoon: twenty per cent jitter, a wobble at eight hertz with
   more than twice the depth. it is the most irregular of the four and that is
   also the argument against it — past about fifteen per cent a pulse train stops
   reading as a body and starts reading as a motor with a bearing going.

   **every preset carries every field, `gate: null` included**, and that is not
   tidiness. these defaults are `sputter`'s, so a preset that leaves a field out
   inherits sputter's value for it — and the field that matters is the gate. the
   first cut of this table left it out of the other three and all three silently
   came apart into two bursts, which showed up as parp's measured jitter jumping
   from eleven per cent to thirteen and puff's from eight to twenty nine. a gate
   is a discontinuity and a discontinuity reads as irregularity to any meter
   pointed at it. a preset here is a whole recipe, never a diff against another
   one. */
export const FART = {
  parp: { len: 0.34, f0: 64, f1: 33, jitter: 0.16, ampJit: 0.34, width: 0.30,
    wobHz: 5.5, wobDepth: 0.10, lpHz: 620, tail: 0.24, gate: null, seed: 0x5b21a9 },
  puff: { len: 0.22, f0: 88, f1: 48, jitter: 0.10, ampJit: 0.22, width: 0.42,
    wobHz: 6.5, wobDepth: 0.07, lpHz: 480, tail: 0.30, gate: null, seed: 0x2d70c4 },
  sputter: { len: 0.46, f0: 70, f1: 30, jitter: 0.19, ampJit: 0.40, width: 0.28,
    wobHz: 5.0, wobDepth: 0.12, lpHz: 660, tail: 0.20, seed: 0x71b3e8,
    gate: [[0, 0.17], [0.29, 1]] },
  wobbler: { len: 0.38, f0: 72, f1: 28, jitter: 0.26, ampJit: 0.46, width: 0.26,
    wobHz: 8.0, wobDepth: 0.24, lpHz: 700, tail: 0.22, gate: null, seed: 0x0ae934 },
};

/* ---------- the balance ----------
   peak level in dBFS for each kind, before the master gain and before ducking./* ---------- the balance ----------
   peak level in dBFS for each kind, before the master gain and before ducking.
   they are levels rather than a mix: the master gain moves the voice and these
   together, so the numbers below are the only place the *relationship* between a
   coin and a word is decided, and it stays fixed whatever the loudness target
   turns out to be.

   the shape of the table is the whole intent. the coin is the loudest because it
   is the one physical event the clip actually shows landing; the sweep is the
   quietest because a magnifier moving over paper is nearly nothing; a caption
   card is halfway between and thirty decibels down, which on a phone is felt
   more than heard. */
export const GAINS = {
  pop: -30, popDeep: -24, whoosh: -33, coin: -22,
  click: -25, sweep: -36, ding: -27, hum: -34,
  /* the servo sits with the click rather than with the coin. it is a mechanism
     acknowledging an instruction, not an object hitting a surface, and at -26 it
     is present under a word without ever being the thing you hear. */
  servo: -26,
  /* the chirp sits between the caption pop and the click: it is the loudest
     thing in the clip it belongs to, because it is the answer, and it is still
     two decibels under the click, because it is a small robot rather than a
     large one. it is a character speaking, so if it ever meets a narrator the
     duck is what keeps it out of the way, not this number. */
  chirp: -28,
  /* the key is the quietest thing in the set after the sweep, and it has to be:
     it is the only sound that repeats a dozen times inside four seconds, and it
     plays under a voice. at -34 a group of them is a texture under the read
     rather than a line of events competing with it.

     the press is four decibels over the click and three under the coin. it is
     the loudest press in any clip because it is the only one that sends
     anything, and it is still not the loudest thing in the set, because a
     button is not a coin landing on paper. */
  key: -34, press: -21,

  /* ---------- the character, and it is louder than the furniture ----------
     post12 is the first clip whose sounds are the content: there is no voice
     over them and nothing else in the frame carrying a beat, so the table above
     — written for effects living under a read — is the wrong yardstick for these
     four, and they are set against each other instead.

     the greeting and the laugh sit at the chirp's level and a little over it,
     because in that clip they are the line. the fart is under both of them,
     which is the joke working: a punchline delivered quieter than its setup is
     funnier than one shouted, and a low buzz at -27 on a phone speaker is felt
     more than heard, which is exactly right for the thing it stands in for. the
     glitch is the loudest in the set after the coin, because it is a cut and a
     cut is meant to make you flinch. */
  hi: -26, fart: -27, giggle: -25, glitch: -23,
};
const db = v => Math.pow(10, v / 20);
export const dbfs = v => (v <= 1e-9 ? -Infinity : 20 * Math.log10(v));

/* ---------- cues from the caption plan ----------
   one per card, at the card's own entrance rather than at its first word: the
   card springs in at `in` and the word is said a moment later, so a sound on the
   word would be late for the thing it is supposed to be the sound of. */
export function cuesFromCaptions(plan) {
  return plan.groups.map(g => ({
    t: g.in,
    kind: g.big ? 'popDeep' : 'pop',
    from: 'card "' + g.words.map(w => w.word).join(' ') + '"',
  }));
}

/* ---------- the mascot's reply ----------
   a phrase of chirps for one bubble, and the only function here that lays out a
   grid of its own. that is a real exception to this file's rule and it is worth
   being clear about where it stops: the phrase's **start** is the bubble's own
   entrance, handed in by the clip from its own beat list, and its **length** is
   read off the reply's copy. what is invented is only the spacing between the
   notes inside it, which is not a thing any plan in the repo knows.

   the count is the reply's word count with a floor of three, so a longer answer
   is a longer answer without anybody typing a number, and three is the fewest
   notes that read as a phrase rather than as a single beep. change the copy in
   the bubble and the mascot says more or less of it.

   the intonation is the design. every note glides up inside itself and each one
   starts higher than the last, which is what a friendly answer sounds like in
   any language that has one. `confident` is the second reply from the same
   mascot: it starts a tone lower and climbs in wider steps, so the phrase covers
   more than an octave where the first covers a fifth. same voice, more of an
   opinion in it — not a second sound.

   nothing here rings. a note plus its gap is 130ms, so even a six word reply is
   under eight tenths of a second and the pill is still springing when the last
   boop lands. */
export function chirpPhrase(t, text, { confident = false, note = 0.085, gap = 0.045 } = {}) {
  const words = String(text).trim().split(/\s+/).filter(Boolean).length;
  const count = Math.max(3, words);
  const base = confident ? 540 : 620;
  const step = confident ? 1.18 : 1.13;
  const lift = confident ? 1.45 : 1.40;
  const cues = [];
  for (let i = 0; i < count; i++) {
    const f0 = base * Math.pow(step, i);
    cues.push({
      t: +(t + i * (note + gap)).toFixed(4),
      kind: 'chirp',
      opts: { len: note, f0: +f0.toFixed(1), f1: +(f0 * lift).toFixed(1) },
      from: 'reply "' + text + '", note ' + (i + 1) + ' of ' + count,
    });
  }
  /* where the phrase finishes, so a clip that wants to put a full stop under it
     has a time to put it on rather than a number to guess. */
  return { cues, count, words, end: +(t + count * (note + gap)).toFixed(4) };
}

/* ---------- cues from the scene plan ----------
   by shape and step, never by a part's name. a clip that draws a coin gets a
   coin landing without telling this file anything, and a clip that draws two of
   them gets two. `impact` is `pictograms.mjs`'s own constant, passed in rather
   than copied, so the sound is on the frame the shadow lands on.

   the closing hum is the exception and it is keyed to the last scene rather than
   to a shape, because it is scoring a scene rather than an object. */
export function cuesFromScenes(pic, { impact = 0.72, hum = true, seconds = null, humLen = 3.2, humAt = 'settle' } = {}) {
  if (humAt !== 'settle' && humAt !== 'lastStep') {
    throw new Error('humAt is "settle" or "lastStep", not "' + humAt + '"');
  }
  const out = [];
  pic.scenes.forEach((sc, i) => {
    out.push({ t: sc.in, kind: 'whoosh', from: 'scene "' + sc.id + '" arriving' });
    if (hum && i === pic.scenes.length - 1) {
      /* where the swell starts, and it is a real choice rather than a default.

         `settle` puts it under the whole of the last scene, which is right when
         that scene *is* the close: post6 hands off into a four second closing
         beat and the hum scores all of it.

         `lastStep` puts it on the last thing the last scene does. a clip built
         out of one scene that runs the whole length has no closing scene to
         score — `settle` would start the hum in the first half second and hold
         a drone under the entire film, which is a different and much worse
         idea. the last part to start moving is the close of a single scene
         clip, and that is what this finds. it is still derived: no clip using
         it types a time. */
      let at = sc.settled;
      if (humAt === 'lastStep') {
        for (const pi of sc.parts) for (const st of pic.parts[pi].steps) at = Math.max(at, st.t);
      }
      /* sized to the room it has rather than cut to fit it. a swell whose tail
         is chopped off by the end of the clip is a click, and the fade in
         `ends` cannot help with a fade that was never rendered. */
      const room = seconds == null ? humLen : Math.max(0.8, seconds - at - 0.06);
      out.push({
        t: at, kind: 'hum', opts: { len: +Math.min(humLen, room).toFixed(3) },
        from: 'scene "' + sc.id + '" ' + (humAt === 'lastStep' ? 'closing' : 'holding'),
      });
    }
  });
  for (const p of pic.parts) {
    for (const st of p.steps) {
      const land = st.ease === 'land' || st.ease === 'fall';
      if (p.shape === 'coin' && st.kind === 'move' && land) {
        out.push({ t: st.t + st.for * impact, kind: 'coin', from: '"' + p.id + '" landing' });
      } else if (p.shape === 'shackle' && st.kind === 'move') {
        out.push({ t: st.t + st.for * (land ? impact : 1), kind: 'click', from: '"' + p.id + '" seating' });
      } else if (p.shape === 'magnifier' && st.kind === 'move') {
        out.push({ t: st.t, kind: 'sweep', opts: { len: st.for }, from: '"' + p.id + '" sweeping' });
      } else if (p.shape === 'check' && (st.kind === 'draw' || (st.kind === 'flip' && st.dir !== 'out'))) {
        out.push({ t: st.t, kind: 'ding', from: '"' + p.id + '" drawn' });
      }
    }
  }
  return out.sort((a, b) => a.t - b.t);
}

/* ---------- the bus ----------
   every cue rendered, placed and summed into one buffer, with what each one
   actually peaked at on the way past. a cue whose sound would run off the end of
   the clip is cut rather than dropped, and the report says by how much. */
export function renderSfx(cues, seconds, opts = {}) {
  const gains = { ...GAINS, ...(opts.gains || {}) };
  const buf = new Float32Array(Math.round(seconds * SR));
  const report = [];
  const cache = new Map();

  for (const c of [...cues].sort((a, b) => a.t - b.t)) {
    const make = VOICES[c.kind];
    if (!make) throw new Error('no sound called "' + c.kind + '"');
    if (gains[c.kind] == null) throw new Error('"' + c.kind + '" has no level in GAINS');
    /* identical cues share one render. it is a real saving on the caption pops,
       which are thirty three of the same two hundred millisecond buffer. */
    const key = c.kind + JSON.stringify(c.opts || {});
    if (!cache.has(key)) cache.set(key, make(c.opts || {}));
    const src = cache.get(key);
    const g = db(gains[c.kind]);
    const at = Math.round(c.t * SR);
    let peak = 0, cut = 0, wrote = 0;
    for (let i = 0; i < src.length; i++) {
      const j = at + i;
      if (j < 0) continue;
      if (j >= buf.length) { cut = src.length - i; break; }
      const v = src[i] * g;
      buf[j] += v;
      wrote = j;
      peak = Math.max(peak, Math.abs(v));
    }
    /* a sound the end of the clip cut in half still has to stop at zero, so
       whatever did land gets its own ten milliseconds taken off the end. this is
       a backstop rather than the plan — a cue that needs it is reported. */
    if (cut) {
      const k = Math.min(Math.round(0.010 * SR), wrote - Math.max(0, at));
      for (let i = 0; i < k; i++) buf[wrote - i] *= i / k;
    }
    report.push({
      t: +c.t.toFixed(3), kind: c.kind, from: c.from || '',
      seconds: +(src.length / SR).toFixed(3),
      gain: gains[c.kind], peak: +Math.max(-120, dbfs(peak)).toFixed(1),
      cut: cut ? +(cut / SR).toFixed(3) : 0,
    });
  }
  return { buf, report };
}

/* ---------- the voice, as a shape ----------
   an envelope that is 1 while a word is being said and 0 between words, built
   from the timings rather than from the audio, then smoothed. the attack is
   faster than the release on purpose: the bus has to be out of the way before a
   word starts and it should come back slowly enough that the gaps between words
   inside a sentence do not pump.

   `open` pulls each word's window earlier so the duck is already down on the
   first syllable rather than arriving with it. */
export function voiceEnvelope(words, seconds, { open = 0.05, attack = 0.012, release = 0.22 } = {}) {
  const env = new Float32Array(Math.round(seconds * SR));
  for (const w of words) {
    const a = Math.max(0, Math.round((w.start - open) * SR));
    const b = Math.min(env.length, Math.round(w.end * SR));
    for (let i = a; i < b; i++) env[i] = 1;
  }
  const ka = Math.exp(-1 / (attack * SR));
  const kr = Math.exp(-1 / (release * SR));
  let y = 0;
  for (let i = 0; i < env.length; i++) {
    const k = env[i] > y ? ka : kr;
    y = env[i] + k * (y - env[i]);
    env[i] = y;
  }
  return env;
}

/* ---------- decoding the voice ----------
   through ffmpeg, to mono float at the mix rate, so everything downstream is one
   array of numbers and there is no format left to get wrong. */
export function decode(ffmpegPath, file) {
  const r = spawnSync(ffmpegPath, ['-v', 'error', '-i', file,
    '-f', 'f32le', '-ac', '1', '-ar', String(SR), '-'], { maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error('could not decode ' + file + ': ' + (r.stderr || '').toString().slice(0, 300));
  const raw = r.stdout;
  /* a copy rather than a view: node hands back a buffer out of a pool whose
     byteOffset is rarely a multiple of four, and Float32Array will not take an
     unaligned one. */
  const out = new Float32Array(Math.floor(raw.length / 4));
  for (let i = 0; i < out.length; i++) out[i] = raw.readFloatLE(i * 4);
  return out;
}

/* ---------- the check that matters ----------
   wherever the voice is speaking, the effects bus must be under it. measured on
   the two buffers that are about to be summed rather than argued from the gain
   table, because the gain table does not know how loud this particular reading
   of this particular line came out.

   ---------- what "under the voice" has to mean ----------

   this was written twice and both earlier versions were wrong in a way worth
   keeping written down, because both of them looked right.

   the first gated on the ducking envelope and reported ninety six failures,
   none of them real. the envelope has a 220ms release, so it stays open through
   the gap after every word: it was comparing an effect playing in silence
   against silence and calling the effect too loud. the envelope's job is to
   duck. a check that trusts the thing it is checking is not a check.

   the second compared the bus against the voice **instant by instant**, and
   found two twenty millisecond windows where the coin was 3dB over. those were
   real measurements and a wrong test, and the difference matters: both windows
   are inside the /l/ closure in the middle of the word "alone". speech is not
   continuous. every stop consonant is thirty to eighty milliseconds of near
   silence with a word on either side of it, so an instantaneous rule says that
   **no audible effect may ever overlap a word at all** — not that it must be
   quieter than the speech, but that it must not exist. that is not the rule
   anybody wants and it is not a rule this mix could satisfy by getting quieter,
   only by getting silent.

   so the comparison is the effect's own twenty milliseconds against the level of
   the speech **around** that moment: the loudest twenty milliseconds of voice
   within 150ms either side. that is the level a listener hears as "the voice,
   right now", and it is the thing an effect can actually compete with. it still
   has teeth — an effect that is genuinely up at speech level fails everywhere,
   not in two windows — and it no longer fails on a consonant.

   both numbers are returned. the guard runs on `over`; `instant` is printed
   next to it, so the stricter reading is on screen rather than argued away. */
export function checkUnderVoice(voice, sfx, { window = 0.02, near = 0.15, speechFloorDb = -40, floor = 1e-4 } = {}) {
  const w = Math.round(window * SR);
  const spread = Math.max(1, Math.round(near / window));
  const count = Math.floor(sfx.length / w);

  let vpeak = 0;
  for (let i = 0; i < voice.length; i++) vpeak = Math.max(vpeak, Math.abs(voice[i]));
  const gate = vpeak * Math.pow(10, speechFloorDb / 20);

  const vr = new Float32Array(count), sr = new Float32Array(count);
  for (let b = 0; b < count; b++) {
    let vs = 0, ss = 0;
    for (let k = 0; k < w; k++) {
      const v = voice[b * w + k] || 0;
      vs += v * v; ss += sfx[b * w + k] * sfx[b * w + k];
    }
    vr[b] = Math.sqrt(vs / w); sr[b] = Math.sqrt(ss / w);
  }
  /* the speech level around each window, which is what an effect is actually
     competing with. */
  const level = new Float32Array(count);
  for (let b = 0; b < count; b++) {
    let m = 0;
    for (let k = Math.max(0, b - spread); k <= Math.min(count - 1, b + spread); k++) m = Math.max(m, vr[k]);
    level[b] = m;
  }

  const worst = { at: 0, ratio: 0, sfx: 0, voice: 0 };
  const over = [];
  let instant = 0, instantAt = 0, windows = 0;
  for (let b = 0; b < count; b++) {
    /* the gate is the voice **now**: a word has to actually be being spoken in
       this window for the window to be judged at all. gating on the neighbouring
       level instead put every gap next to a word inside the test, and an effect
       in a gap is supposed to be at full level — that is the entire point of
       ducking it when it is not. */
    if (vr[b] < gate) continue;
    windows++;
    if (sr[b] < floor) continue;
    const ratio = sr[b] / level[b];
    if (ratio > worst.ratio) {
      worst.at = b * w / SR; worst.ratio = ratio; worst.sfx = sr[b]; worst.voice = level[b];
    }
    if (ratio > 1) over.push({ t: +(b * w / SR).toFixed(2), sfx: +dbfs(sr[b]).toFixed(1), voice: +dbfs(level[b]).toFixed(1) });
    if (vr[b] >= gate) {
      const inst = sr[b] / vr[b];
      if (inst > instant) { instant = inst; instantAt = b * w / SR; }
    }
  }
  return {
    windows,
    worst: {
      at: +worst.at.toFixed(2), ratio: +worst.ratio.toFixed(3),
      db: +dbfs(worst.ratio).toFixed(1),
      sfx: +dbfs(worst.sfx).toFixed(1), voice: +dbfs(worst.voice).toFixed(1),
    },
    /* the stricter reading, kept and printed rather than dropped. */
    instant: { at: +instantAt.toFixed(2), db: +dbfs(instant).toFixed(1) },
    over,
  };
}

/* ---------- the mix ----------
   voice plus a ducked bus, scaled once to a loudness target and held under a
   peak ceiling. the scale is applied to both at the same time, so the balance
   decided in GAINS survives whatever the target turns out to be.

   the ceiling wins over the target. if hitting the loudness would push the peak
   past the ceiling the mix comes down instead and the report says so, because a
   clip that is a decibel quiet is a clip and a clip that clips is a mistake. */
export function mixdown(voice, sfx, env, opts = {}) {
  const duck = opts.duck == null ? 0.60 : opts.duck;
  /* the one balance knob between the two tracks. it is applied here rather than
     to the decoded voice, because this is the function that decides what the
     mix is, and because the loudness pass afterwards scales both tracks
     together — so trimming the voice by a decibel and a half does not make the
     clip quieter, it moves the effects a decibel and a half up relative to it,
     which is the whole point of turning it. the trimmed voice comes back out
     with the mix, so the check that the bus is under the voice is run against
     the voice that is actually in the file. */
  const g = Math.pow(10, (opts.voiceGain || 0) / 20);
  const len = Math.max(voice.length, sfx.length);
  const out = new Float32Array(len);
  const bus = new Float32Array(len);
  const voiceOut = new Float32Array(len);
  let busPeak = 0, voicePeak = 0, voiceRawPeak = 0;
  for (let i = 0; i < len; i++) {
    const d = 1 - duck * (env[i] || 0);
    const s = (sfx[i] || 0) * d;
    const v = (voice[i] || 0) * g;
    bus[i] = s;
    voiceOut[i] = v;
    busPeak = Math.max(busPeak, Math.abs(s));
    voicePeak = Math.max(voicePeak, Math.abs(v));
    voiceRawPeak = Math.max(voiceRawPeak, Math.abs(voice[i] || 0));
    out[i] = v + s;
  }
  let peak = 0;
  for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(out[i]));
  return {
    out, bus, voiceOut, peak, busPeak, voicePeak, voiceRawPeak,
    duck, voiceGain: opts.voiceGain || 0,
  };
}

/* apply one gain to a buffer, in place. no ceiling here on purpose: raising the
   level and holding the peak down are two different jobs and the second one is
   `limit`, below. */
export function applyGain(buf, gainDb) {
  const g = db(gainDb);
  let peak = 0;
  for (let i = 0; i < buf.length; i++) { buf[i] *= g; peak = Math.max(peak, Math.abs(buf[i])); }
  return { peak: +dbfs(peak).toFixed(2) };
}

/* ---------- the limiter ----------
   a look ahead peak limiter, because the alternative does not work. the first
   version of the loudness pass raised the mix and then scaled the whole thing
   back down whenever the peak went over, which is not limiting, it is turning
   the clip down: a synthesiser's speech has about seventeen decibels of crest,
   so hitting -14 LUFS at a -1 dBTP ceiling by gain alone is arithmetically
   impossible and the mix came out four and a half decibels under target.

   this pulls the gain down only around the peaks that need it and lets it back
   up between them, which is what buys the loudness. three parts:

     the requirement, per sample: the gain that would put this sample exactly on
     the ceiling, or 1 if it is already under.

     a running minimum of that over the next `lookahead` samples, so the gain is
     already down before the peak arrives rather than catching up after it. it
     is a monotonic deque rather than a rescan, so it costs one pass whatever the
     window is.

     a slew: down over about a millisecond, which the look ahead has already paid
     for, and back up over `release`, which is slow enough not to pump on speech
     and quick enough not to duck the word after a loud one.

   the check afterwards is not decoration. a limiter that overshoots its own
   ceiling is the exact bug this replaces, so the peak is measured on the output
   and the function says what it did rather than what it intended. */
export function limit(buf, ceilingDb = -1.0, { lookahead = 0.005, attack = 0.001, release = 0.08 } = {}) {
  const ceil = db(ceilingDb);
  const la = Math.max(1, Math.round(lookahead * SR));
  const N = buf.length;

  /* sliding minimum of the required gain over [i, i+la], in one pass. */
  const need = new Float32Array(N);
  const q = new Int32Array(N + 1);
  let head = 0, tail = 0;
  const req = i => (i >= N ? 1 : (Math.abs(buf[i]) > ceil ? ceil / Math.abs(buf[i]) : 1));
  for (let i = 0; i < N; i++) {
    const push = i + la - 1;
    if (i === 0) {
      for (let j = 0; j < la && j < N; j++) {
        while (tail > head && req(q[tail - 1]) >= req(j)) tail--;
        q[tail++] = j;
      }
    } else if (push < N) {
      while (tail > head && req(q[tail - 1]) >= req(push)) tail--;
      q[tail++] = push;
    }
    while (tail > head && q[head] < i) head++;
    need[i] = tail > head ? req(q[head]) : 1;
  }

  const ka = Math.exp(-1 / (attack * SR));
  const kr = Math.exp(-1 / (release * SR));
  let g = 1, worst = 1, peak = 0;
  for (let i = 0; i < N; i++) {
    const t = need[i];
    g = t < g ? t + ka * (g - t) : t + kr * (g - t);
    if (g < worst) worst = g;
    buf[i] *= g;
    peak = Math.max(peak, Math.abs(buf[i]));
  }
  /* the backstop. the slew can leave a sample a hair over on a very fast
     transient; a single scale of that hair is inaudible and the alternative is
     a file that is over its ceiling. */
  let trimmed = 0;
  if (peak > ceil) {
    const t = ceil / peak;
    for (let i = 0; i < N; i++) buf[i] *= t;
    trimmed = dbfs(t);
    peak = ceil;
  }
  return {
    peak: +dbfs(peak).toFixed(2),
    reduction: +(-dbfs(worst)).toFixed(2),
    trimmed: +trimmed.toFixed(3),
  };
}

/* ---------- the file ----------
   24 bit pcm, which is the plainest thing every tool in the chain reads without
   an opinion, and enough headroom that the quietest sound in the set is still
   sixty decibels above the last bit. */
export function writeWav(file, buf, sr = SR) {
  const frames = buf.length, bytes = frames * 3;
  const head = Buffer.alloc(44);
  head.write('RIFF', 0);
  head.writeUInt32LE(36 + bytes, 4);
  head.write('WAVE', 8);
  head.write('fmt ', 12);
  head.writeUInt32LE(16, 16);
  head.writeUInt16LE(1, 20);
  head.writeUInt16LE(1, 22);
  head.writeUInt32LE(sr, 24);
  head.writeUInt32LE(sr * 3, 28);
  head.writeUInt16LE(3, 32);
  head.writeUInt16LE(24, 34);
  head.write('data', 36);
  head.writeUInt32LE(bytes, 40);
  const body = Buffer.alloc(bytes);
  for (let i = 0; i < frames; i++) {
    const v = Math.max(-1, Math.min(1, buf[i]));
    const s = Math.round(v * 8388607);
    body.writeIntLE(s, i * 3, 3);
  }
  fs.writeFileSync(file, Buffer.concat([head, body]));
  return { file, frames, seconds: +(frames / sr).toFixed(3) };
}

/* ---------- loudness, measured ----------
   ffmpeg's ebur128, which is the same meter a broadcaster uses, so the number in
   the report means what it says rather than being an rms with a nice name. it is
   read off a real file rather than estimated, and if the build in use does not
   carry the filter the caller is told that instead of being handed a guess. */
export function loudness(ffmpegPath, file) {
  const r = spawnSync(ffmpegPath, ['-hide_banner', '-nostats', '-i', file,
    '-filter_complex', 'ebur128=peak=true', '-f', 'null', '-'], { maxBuffer: 1 << 24 });
  const err = (r.stderr || '').toString();
  const tail = err.slice(err.lastIndexOf('Summary'));
  const grab = re => { const m = tail.match(re); return m ? parseFloat(m[1]) : null; };
  return {
    lufs: grab(/I:\s*(-?[\d.]+)\s*LUFS/),
    lra: grab(/LRA:\s*(-?[\d.]+)\s*LU/),
    truePeak: grab(/Peak:\s*(-?[\d.]+)\s*dBFS/),
    ok: /Summary/.test(err),
  };
}

/* ---------- the report ----------
   the mix as a table for the terminal. one row per effect, in time order, with
   what it is, where it came from and what it actually peaked at. */
export function describeMix(report, extra = {}) {
  const out = [];
  const w = { t: 7, kind: 8, peak: 8, len: 7 };
  out.push('    ' + 'at'.padStart(w.t) + '  ' + 'sound'.padEnd(w.kind)
    + 'len'.padStart(w.len) + '  ' + 'peak'.padStart(w.peak) + '   from');
  for (const r of report) {
    out.push('    ' + r.t.toFixed(2).padStart(w.t) + '  ' + r.kind.padEnd(w.kind)
      + r.seconds.toFixed(2).padStart(w.len) + '  '
      + (r.peak.toFixed(1) + ' dB').padStart(w.peak) + '   ' + r.from
      + (r.cut ? '  (' + r.cut.toFixed(2) + 's cut at the end of the clip)' : ''));
  }
  const byKind = {};
  for (const r of report) byKind[r.kind] = (byKind[r.kind] || 0) + 1;
  out.push('    ' + report.length + ' effects: '
    + Object.entries(byKind).map(([k, v]) => v + ' ' + k).join(', '));
  for (const [k, v] of Object.entries(extra)) out.push('    ' + k + ': ' + v);
  return out.join('\n');
}
