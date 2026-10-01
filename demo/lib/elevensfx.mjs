/* the boring tek — demo/lib/elevensfx.mjs. sound effects from elevenlabs, for
   the few sounds that would sound fake in code: paper, weight, wind, rumble.

   tooling, not the site. lib/sfx.mjs stays the first choice: a sound goes
   through here only when a beat sheet says so.

   plain fetch to the sound generation endpoint, no package. the key comes from
   demo/.env and only from there, never from the shell, and it is never
   printed: every string this file prints or throws goes through `redact`.

   every take is cached in demo/out/sfx-postNN/ with a sidecar of its prompt,
   so a rerun spends nothing. several takes a sound, one kept by measurement:

     hit   the most punch: the loudest 50ms in the 150ms after the strike
           against the level 0.3 to 0.5s after it, so a hit that lands and
           dies beats one that smears. trimmed so the strike sits 2ms into the
           buffer and the cue lands on it
     bed   the steadiest, the least spread in its 50ms levels, faded at both ends

   the kept take is decoded to the mix rate, trimmed, faded to zero at both ends,
   peak normalised to 1, and registered as a sound kind of its own in lib/sfx.mjs
   with its level, so a timing list plays it like any other.

     import { elevenSfx } from './lib/elevensfx.mjs';
     const kept = await elevenSfx(48, [
       { kind: 'elSlam', prompt: '...', seconds: 1.2, mode: 'hit', gain: -12 },
       { kind: 'elWind', prompt: '...', seconds: 5, mode: 'bed', hp: 180, gain: -20 },
     ]);
*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpeg from 'ffmpeg-static';
import { SR, decode, VOICES, GAINS } from './sfx.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEMO = path.resolve(HERE, '..');
const URL_SFX = 'https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128';

/* demo/.env by hand, voice.mjs's reader, and nothing from process.env */
function keyFromFile() {
  let raw = '';
  try { raw = fs.readFileSync(path.join(DEMO, '.env'), 'utf8'); } catch { return ''; }
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*(?:export\s+)?ELEVENLABS_API_KEY\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[1].trim();
    if (/^".*"$/.test(v) || /^'.*'$/.test(v)) v = v.slice(1, -1);
    return v;
  }
  return '';
}
const KEY = keyFromFile();
const redact = s => (KEY ? String(s).split(KEY).join('<elevenlabs key>') : String(s));

async function fetchTake(prompt, seconds, influence, file) {
  if (!KEY) throw new Error('no ELEVENLABS_API_KEY in demo/.env');
  let res;
  try {
    res = await fetch(URL_SFX, {
      method: 'POST',
      headers: { 'xi-api-key': KEY, 'content-type': 'application/json', accept: 'audio/mpeg' },
      body: JSON.stringify({ text: prompt, duration_seconds: seconds, prompt_influence: influence }),
    });
  } catch (e) { throw new Error(redact('the sound request failed: ' + (e && e.message || e))); }
  if (!res.ok) throw new Error(redact('elevenlabs said ' + res.status + ': ' + (await res.text()).slice(0, 300)));
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
}

const rmsAt = (pcm, a, len) => { let e = 0, n = 0; for (let i = Math.max(0, a); i < Math.min(pcm.length, a + len); i++) { e += pcm[i] * pcm[i]; n++; } return n ? Math.sqrt(e / n) : 0; };

/* a hit: where it strikes, and how much it lands and dies */
function strike(pcm) {
  const B = Math.round(0.005 * SR);
  let peak = 0; for (let i = 0; i < pcm.length; i++) peak = Math.max(peak, Math.abs(pcm[i]));
  const gate = peak * 0.08;
  let at = 0;
  for (let i = 0; i < pcm.length; i++) if (Math.abs(pcm[i]) > gate) { at = i; break; }
  /* back up to the start of the rise: the first block 20dB under the gate */
  let a = at; while (a > B && rmsAt(pcm, a - B, B) > gate * 0.1) a -= B;
  let loud = 0;
  for (let i = a; i < a + 0.15 * SR; i += B) loud = Math.max(loud, rmsAt(pcm, i, 10 * B));
  const tail = rmsAt(pcm, a + Math.round(0.3 * SR), Math.round(0.2 * SR)) + 1e-6;
  return { at: a, punch: +(20 * Math.log10(loud / tail)).toFixed(1) };
}
/* a bed: the spread of its 50ms levels in dB, over the middle 80% */
function spread(pcm) {
  const B = Math.round(0.05 * SR), lv = [];
  for (let i = Math.round(pcm.length * 0.1); i + B < pcm.length * 0.9; i += B) lv.push(20 * Math.log10(rmsAt(pcm, i, B) + 1e-6));
  const m = lv.reduce((x, y) => x + y, 0) / lv.length;
  return +Math.sqrt(lv.reduce((x, y) => x + (y - m) * (y - m), 0) / lv.length).toFixed(2);
}
/* a two pole high pass, for a bed whose low end a phone speaker cannot play and
   which only eats the limiter's headroom */
function highPass(b, hz) {
  const a = Math.exp(-2 * Math.PI * hz / SR);
  for (let pass = 0; pass < 2; pass++) { let y = 0, p = 0; for (let i = 0; i < b.length; i++) { y = a * (y + b[i] - p); p = b[i]; b[i] = y; } }
  return b;
}
function finish(pcm, fadeIn, fadeOut, hp = 0) {
  const b = Float32Array.from(pcm);
  if (hp) highPass(b, hp);
  const fi = Math.round(fadeIn * SR), fo = Math.round(fadeOut * SR);
  for (let i = 0; i < Math.min(fi, b.length); i++) b[i] *= i / fi;
  for (let i = 0; i < Math.min(fo, b.length); i++) b[b.length - 1 - i] *= i / fo;
  let peak = 0; for (let i = 0; i < b.length; i++) peak = Math.max(peak, Math.abs(b[i]));
  if (peak > 0) for (let i = 0; i < b.length; i++) b[i] /= peak;
  return b;
}

export async function elevenSfx(post, list, { tries = 3 } = {}) {
  const DIR = path.join(DEMO, 'out', 'sfx-post' + post);
  fs.mkdirSync(DIR, { recursive: true });
  const kept = {};
  for (const s of list) {
    const influence = s.influence ?? 0.6;
    const takes = [];
    for (let n = 1; n <= tries; n++) {
      const file = path.join(DIR, s.kind + '-t' + n + '.mp3'), side = file.replace(/\.mp3$/, '.json');
      let ok = false;
      try { const j = JSON.parse(fs.readFileSync(side, 'utf8')); ok = j.prompt === s.prompt && j.seconds === s.seconds && j.influence === influence && fs.existsSync(file); } catch { }
      if (!ok) {
        await fetchTake(s.prompt, s.seconds, influence, file);
        fs.writeFileSync(side, JSON.stringify({ prompt: s.prompt, seconds: s.seconds, influence }, null, 2));
      }
      const pcm = decode(ffmpeg, file);
      const t = { n, file, pcm };
      if (s.mode === 'hit') { const st = strike(pcm); t.at = st.at; t.score = st.punch; t.note = 'punch ' + st.punch + 'dB, strike at ' + (st.at / SR).toFixed(3) + 's'; }
      else { t.score = -spread(pcm); t.note = 'spread ' + (-t.score) + 'dB'; }
      takes.push(t);
    }
    const best = takes.reduce((x, y) => (y.score > x.score ? y : x));
    let pcm = best.pcm;
    if (s.mode === 'hit') {
      const a = Math.max(0, best.at - Math.round(0.002 * SR));
      pcm = pcm.subarray(a, Math.min(pcm.length, a + Math.round((s.keep ?? s.seconds) * SR)));
      pcm = finish(pcm, 0.0015, Math.min(0.12, pcm.length / SR / 3));
    } else {
      pcm = pcm.subarray(0, Math.min(pcm.length, Math.round((s.keep ?? s.seconds) * SR)));
      pcm = finish(pcm, s.fadeIn ?? 0.4, s.fadeOut ?? 0.6, s.hp || 0);
    }
    VOICES[s.kind] = () => pcm;
    GAINS[s.kind] = s.gain;
    kept[s.kind] = { take: best.n, seconds: +(pcm.length / SR).toFixed(3), all: takes.map(x => 't' + x.n + ' ' + x.note + (x === best ? ' KEPT' : '')) };
  }
  return kept;
}
