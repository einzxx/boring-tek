/* the boring tek — video-review: pull frames out of a local mp4.

   the extraction half of skills/video-review. it reads a file off disk, works
   out how often to sample it, and writes one jpeg per sample with the second it
   was taken from in its own filename. nothing here looks at a frame: reading is
   the vision half's job and it happens in the conversation, not in this file.

   adapted from fabriqaai/ffmpeg-analyse-video-skill, which is instructions only
   and ships no code. what was taken is the shape of it — sample, batch, read,
   synthesise — and the sampling ladder. what was dropped is everything that
   reaches the network: no yt-dlp, no downloads, no whisper. our clips are made
   here and their scripts are written down before the voice is synthesised, so
   there is nothing to transcribe and nothing to fetch.

   it uses demo/node_modules' ffmpeg-static, which is already a dependency of
   the render pipeline. that binary ships no ffprobe, so the metadata is parsed
   off ffmpeg's own stderr exactly as demo/post9.mjs parses it.

     node skills/video-review/frames.mjs demo/out/post9-1080x1920.mp4
     node ... post9.mp4 --every=0.5            twice as dense
     node ... post9.mp4 --from=8 --to=18       one stretch of it
     node ... post9.mp4 --guides               draw the platform safe area on
     node ... post9.mp4 --width=720            bigger jpegs, slower to read
*/

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
/* resolved out of demo/, because that is where this repo keeps the one
   node_modules it has. the site itself still depends on nothing. */
const req = createRequire(path.join(ROOT, 'demo', 'package.json'));
let ffmpeg;
try { ffmpeg = req('ffmpeg-static'); }
catch (e) {
  console.error('no ffmpeg-static. run: cd demo && npm install');
  process.exit(1);
}

const argv = process.argv.slice(2);
const file = argv.find(a => !a.startsWith('--'));
const opt = (name, dflt) => {
  const hit = argv.find(a => a === '--' + name || a.startsWith('--' + name + '='));
  if (hit === undefined) return dflt;
  return hit.includes('=') ? hit.split('=').slice(1).join('=') : true;
};
if (!file) {
  console.error('usage: node skills/video-review/frames.mjs <file.mp4> [--every=1] [--from=0] [--to=] [--width=540] [--guides] [--out=dir]');
  process.exit(1);
}
const SRC = path.resolve(file);
if (!fs.existsSync(SRC)) { console.error('no such file: ' + SRC); process.exit(1); }

/* ---------- the platform safe area, for --guides ----------
   the same numbers post9 guards against and MEMORY records: what tiktok,
   instagram and youtube leave once their own chrome is on the frame. device px
   of a 1080x1920 master. a clip that is not for a platform does not want these
   drawn on it, which is why they are opt in. */
const SAFE = { top: 180, bottom: 220, left: 140, right: 140 };

/* ---------- metadata ----------
   ffmpeg-static ships no ffprobe, so this reads ffmpeg's own stderr. the same
   parse demo/post9.mjs uses, kept in step with it deliberately. */
function probe(f) {
  let out = '';
  try { execFileSync(ffmpeg, ['-hide_banner', '-i', f], { stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { out = (e.stderr || '').toString(); }
  const dur = out.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
  const res = out.match(/,\s*(\d{2,5})x(\d{2,5})[\s,]/);
  const fps = out.match(/([\d.]+)\s*fps/);
  return {
    seconds: dur ? (+dur[1] * 3600 + +dur[2] * 60 + parseFloat(dur[3])) : null,
    w: res ? +res[1] : null, h: res ? +res[2] : null,
    fps: fps ? parseFloat(fps[1]) : null,
    audio: /Audio:\s*(\w+)/.test(out),
    acodec: (out.match(/Audio:\s*(\w+)/) || [])[1] || null,
  };
}

const meta = probe(SRC);
if (!meta.seconds) { console.error('ffmpeg could not read a duration out of that file'); process.exit(1); }

const FROM = Math.max(0, Number(opt('from', 0)) || 0);
const TO = Math.min(meta.seconds, Number(opt('to', meta.seconds)) || meta.seconds);
const WIDTH = Number(opt('width', 540)) || 540;
const GUIDES = !!opt('guides', false);
const MAX = Number(opt('max', 60)) || 60;
const span = Math.max(0.001, TO - FROM);

/* ---------- how often to sample ----------
   the upstream skill's ladder, kept because it is sensible, with the short end
   made denser: our clips are twenty odd seconds and every beat matters, so a
   frame every two seconds would miss whole shots. past ten minutes this stops
   being the right tool and says so rather than sampling something useless. */
let every = Number(opt('every', 0)) || 0;
if (!every) {
  every = span <= 45 ? 1.0
    : span <= 180 ? 2.0
      : span <= 600 ? 5.0
        : span / MAX;
}
let count = Math.floor(span / every) + 1;
if (count > MAX) { every = span / (MAX - 1); count = MAX; }

const OUT = path.resolve(String(opt('out', path.join(path.dirname(SRC), 'frames-review-' + path.basename(SRC, path.extname(SRC))))));
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

/* the scale, and the guides if they were asked for. -1 keeps the aspect and
   rounds to an even number, which jpeg wants. */
const vf = ['scale=' + WIDTH + ':-2'];
if (GUIDES) {
  /* one rectangle, drawn after the scale so the numbers are a fraction of the
     master rather than of the jpeg. magenta because nothing in this brand is
     magenta, so a guide can never be mistaken for something we drew. */
  const k = WIDTH / (meta.w || WIDTH);
  const x = Math.round(SAFE.left * k), y = Math.round(SAFE.top * k);
  const w = Math.round((meta.w - SAFE.left - SAFE.right) * k);
  const h = Math.round((meta.h - SAFE.top - SAFE.bottom) * k);
  vf.push('drawbox=x=' + x + ':y=' + y + ':w=' + w + ':h=' + h + ':color=magenta@0.7:t=2');
}

console.log('the boring tek — video-review, frames');
console.log('  ' + path.relative(ROOT, SRC));
console.log('  ' + meta.w + 'x' + meta.h + ' @' + meta.fps + 'fps, ' + meta.seconds.toFixed(2) + 's, '
  + (meta.audio ? 'audio ' + meta.acodec : 'SILENT'));
console.log('  sampling ' + FROM.toFixed(2) + '..' + TO.toFixed(2) + 's every '
  + every.toFixed(2) + 's = ' + count + ' frame(s) at ' + WIDTH + 'px wide'
  + (GUIDES ? ', platform safe area drawn on' : ''));

const rows = [];
for (let i = 0; i < count; i++) {
  const t = Math.min(TO - 0.001, FROM + i * every);
  const name = 'f' + String(i + 1).padStart(3, '0') + '_t' + t.toFixed(2) + 's.jpg';
  /* -ss before -i so ffmpeg seeks rather than decodes up to the mark: it is the
     difference between a second and a minute over sixty frames. accurate enough
     at this scale because the input is an all intra jpeg sequence encode. */
  execFileSync(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error',
    '-ss', String(t), '-i', SRC, '-frames:v', '1',
    '-vf', vf.join(','), '-q:v', '3', path.join(OUT, name)],
    { stdio: ['ignore', 'pipe', 'pipe'] });
  rows.push({ i: i + 1, t: +t.toFixed(2), file: name });
}

/* the index. it is what the reading half is handed: a list of files and the
   second each one is, so a batch of images never has to be matched back to a
   timeline by guessing. */
const index = {
  source: path.relative(ROOT, SRC).split(path.sep).join('/'),
  seconds: +meta.seconds.toFixed(2), w: meta.w, h: meta.h, fps: meta.fps,
  audio: meta.audio, from: +FROM.toFixed(2), to: +TO.toFixed(2),
  every: +every.toFixed(3), width: WIDTH, guides: GUIDES,
  count: rows.length, dir: path.relative(ROOT, OUT).split(path.sep).join('/'),
  frames: rows,
};
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 2));
const lines = rows.map(r => '  ' + String(r.i).padStart(3) + '  ' + r.t.toFixed(2).padStart(6) + 's  ' + r.file);
fs.writeFileSync(path.join(OUT, 'index.txt'),
  ['frames from ' + index.source, '', ...lines, ''].join('\n'));

console.log('  wrote ' + rows.length + ' frame(s) to ' + index.dir);
console.log('  index.json and index.txt sit beside them');
