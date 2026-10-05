/* the boring tek — demo/lib/elevenmusic.mjs. a music bed from the elevenlabs
   music api, for the site videos.

   tooling, not the site. elevensfx.mjs's way: plain fetch, no package, the key
   from demo/.env and only from there, never from the shell, never printed:
   every string this file prints or throws goes through `redact`.

   every take is cached in demo/out/music-NAME/ with a sidecar of its prompt and
   length, so a rerun spends nothing. several takes, one kept by measurement,
   in this order:

     length   a take more than 0.3s off the asked length is out
     voice    the share of its energy in 300 to 3400 hz, where a voice lives.
              less is better: the bed leaves the words alone
     steady   the spread of its 250ms levels over the middle 80%, in dB.
              less is better: a bed that surges fights the read
     ending   the level of its last 0.3s against its median. it has to end,
              not stop mid phrase: a tail under -6dB is clean

   the kept take is decoded to the mix rate, cut or padded to the exact length,
   given a gentle fade in and a short fade to zero at the very end, and handed
   back as a Float32Array for the rig's `music` option.

     import { elevenMusic } from './lib/elevenmusic.mjs';
     const bed = await elevenMusic('site-who', { prompt: '...', seconds: 16.5 });
*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpeg from 'ffmpeg-static';
import { SR, decode } from './sfx.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEMO = path.resolve(HERE, '..');
const URL_MUSIC = 'https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128';

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

async function fetchTake(prompt, seconds, file) {
  if (!KEY) throw new Error('no ELEVENLABS_API_KEY in demo/.env');
  let res;
  try {
    res = await fetch(URL_MUSIC, {
      method: 'POST',
      headers: { 'xi-api-key': KEY, 'content-type': 'application/json', accept: 'audio/mpeg' },
      body: JSON.stringify({ prompt, music_length_ms: Math.round(seconds * 1000), model_id: 'music_v1', force_instrumental: true }),
    });
  } catch (e) { throw new Error(redact('the music request failed: ' + (e && e.message || e))); }
  if (!res.ok) { const err = new Error(redact('elevenlabs said ' + res.status + ': ' + (await res.text()).slice(0, 300))); err.status = res.status; throw err; }
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
}

const rms = (b, a, n) => { let e = 0, k = 0; for (let i = Math.max(0, a); i < Math.min(b.length, a + n); i++) { e += b[i] * b[i]; k++; } return k ? Math.sqrt(e / k) : 0; };
const db = v => 20 * Math.log10(v + 1e-9);
/* one pole high and low pass, for the voice band share */
function band(pcm, lo, hi) {
  const b = Float32Array.from(pcm);
  const ah = Math.exp(-2 * Math.PI * lo / SR), al = Math.exp(-2 * Math.PI * hi / SR);
  for (let pass = 0; pass < 2; pass++) {
    let y = 0, p = 0; for (let i = 0; i < b.length; i++) { y = ah * (y + b[i] - p); p = b[i]; b[i] = y; }
    y = 0; for (let i = 0; i < b.length; i++) { y = (1 - al) * b[i] + al * y; b[i] = y; }
  }
  return b;
}
function measure(pcm, seconds) {
  const len = pcm.length / SR;
  const all = rms(pcm, 0, pcm.length), vb = rms(band(pcm, 300, 3400), 0, pcm.length);
  const B = Math.round(0.25 * SR), lv = [];
  for (let i = Math.round(pcm.length * 0.1); i + B < pcm.length * 0.9; i += B) lv.push(db(rms(pcm, i, B)));
  const m = lv.reduce((x, y) => x + y, 0) / lv.length;
  const steady = Math.sqrt(lv.reduce((x, y) => x + (y - m) * (y - m), 0) / lv.length);
  const med = [...lv].sort((x, y) => x - y)[lv.length >> 1];
  const tail = db(rms(pcm, pcm.length - Math.round(0.3 * SR), Math.round(0.3 * SR))) - med;
  return { len: +len.toFixed(2), off: +Math.abs(len - seconds).toFixed(2), voice: +(vb * vb / (all * all)).toFixed(3), steady: +steady.toFixed(2), tail: +tail.toFixed(1) };
}

export async function elevenMusic(name, { prompt, seconds, tries = 3, fadeIn = 0.6, fadeOut = 0.12 }) {
  const DIR = path.join(DEMO, 'out', 'music-' + name);
  fs.mkdirSync(DIR, { recursive: true });
  const takes = [];
  for (let n = 1; n <= tries; n++) {
    const file = path.join(DIR, 't' + n + '.mp3'), side = file.replace(/\.mp3$/, '.json');
    let ok = false;
    try { const j = JSON.parse(fs.readFileSync(side, 'utf8')); ok = j.prompt === prompt && j.seconds === seconds && fs.existsSync(file); } catch { }
    if (!ok) {
      await fetchTake(prompt, seconds, file);
      fs.writeFileSync(side, JSON.stringify({ prompt, seconds }, null, 2));
    }
    const pcm = decode(ffmpeg, file);
    const m = measure(pcm, seconds);
    m.ok = m.off <= 0.3 && m.tail <= -6;
    /* less voice band and less spread win, both scaled to about the same size */
    m.score = +(-(m.voice * 20) - m.steady).toFixed(3);
    takes.push({ n, file, pcm, m });
  }
  const good = takes.filter(x => x.m.ok);
  const pool = good.length ? good : takes;
  const best = pool.reduce((x, y) => (y.m.score > x.m.score ? y : x));
  /* the exact length, a gentle start and a clean zero at the end */
  const N = Math.round(seconds * SR), out = new Float32Array(N);
  out.set(best.pcm.subarray(0, Math.min(N, best.pcm.length)));
  const fi = Math.round(fadeIn * SR), fo = Math.round(fadeOut * SR);
  for (let i = 0; i < fi; i++) out[i] *= Math.sin(Math.PI / 2 * i / fi) ** 2;
  for (let i = 0; i < fo; i++) out[N - 1 - i] *= i / fo;
  return {
    pcm: out, take: best.n, clean: !!good.length,
    all: takes.map(x => 't' + x.n + ' ' + x.m.len + 's, voice band ' + x.m.voice + ', spread ' + x.m.steady + 'dB, tail ' + x.m.tail + 'dB' + (x.m.ok ? '' : ' (out)') + (x === best ? ' KEPT' : '')),
  };
}
