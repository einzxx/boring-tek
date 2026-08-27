/* the boring tek — the reference analyzer.

   point it at a video somebody else made and it writes down how that video is
   built: how long it is, where it cuts, when the first word lands, how fast the
   words come, where the ink sits on the frame, and what our own caption engine
   would do with the same transcript. the output is a markdown file you read,
   not a json file you parse.

     node analyze.mjs path/to/reference.mp4
     node analyze.mjs ref.mp4 --model=small --scene=0.24
     node analyze.mjs ref.mp4 --no-whisper        skip the transcript entirely
     node analyze.mjs ref.mp4 --words=out/voice/x.json   use a word list you already have
     node analyze.mjs --install-whisper           set the transcriber up, once

   what it is for. a reel that works has a skeleton: a hook inside the first
   second, a cut every so often, a caption cadence, and a shape to where things
   sit in the frame. that skeleton is not the video and copying it is not
   copying the video. this reads the skeleton off a reference so the next clip
   can be built to it in our own type, our own colours and our own copy.

   it reads. it never writes to the file you give it, it never uploads it, and
   the only thing that leaves this machine is the model download the first time
   the transcriber runs.

   ---------- the four passes, and which of them can fail ----------

   1. **the file.** duration, resolution, frame rate, whether there is sound.
      pure ffmpeg. cannot fail on anything ffmpeg can open.

   2. **the cuts.** ffmpeg's own scene score, thresholded. this is the pass with
      a knob on it: `--scene` defaults to 0.28, which is about right for edited
      social video and too low for anything with a lot of camera movement. the
      report prints the score of every cut it found so the threshold can be
      argued with rather than trusted.

   3. **the words.** faster-whisper, in a virtualenv under out/, transcribing
      with word timestamps. this is the pass that can be missing, and there is a
      real fallback when it is: ffmpeg's `silencedetect` splits the audio into
      speech and pause, which gives the rhythm of the delivery — how long the
      phrases are, how long the breaths are, when the talking starts — without
      any of the words. that is most of what the skeleton needs. the report says
      which of the two it used, at the top, every time.

   4. **the frame.** stills at every cut and on a fixed cadence, written next to
      the report. then, per still, either tesseract if it happens to be on the
      machine, or an edge density reading of the top, middle and bottom third,
      which says where the busy part of the frame is without claiming to read
      it. the report is explicit about which one it did.
*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
import { planCaptions, describe } from './lib/captions.mjs';
import { sentencesOf } from './lib/voice.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'out', 'analysis');
/* the venv and the model cache both live under out/, which is gitignored whole.
   half a gigabyte of transcriber is scratch, not source, and putting it here
   means deleting it is deleting one folder. */
const VENV = path.join(HERE, 'out', 'whisper-venv');
const VENV_PY = process.platform === 'win32'
  ? path.join(VENV, 'Scripts', 'python.exe')
  : path.join(VENV, 'bin', 'python');
const MODELS = path.join(HERE, 'out', 'whisper-models');

const argv = process.argv.slice(2);
const flags = {};
const rest = [];
for (const a of argv) {
  const m = a.match(/^--([a-z-]+)(?:=(.*))?$/);
  if (m) flags[m[1]] = m[2] === undefined ? true : m[2];
  else rest.push(a);
}

/* ---------- ffmpeg, three ways ----------
   ffprobe is not in ffmpeg-static, so everything here is ffmpeg reading a file
   and being asked to produce nothing. the interesting output is on stderr for
   the log filters and on stdout for `metadata=print:file=-`. */
function ffRun(args) {
  const r = spawnSync(ffmpeg, ['-hide_banner', ...args], { encoding: 'utf8', maxBuffer: 1 << 28 });
  return { out: r.stdout || '', err: r.stderr || '', code: r.status };
}

function probe(file) {
  const { err } = ffRun(['-i', file]);
  const dur = err.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
  const vid = err.match(/Stream #\d+:\d+.*?: Video:\s*([a-z0-9]+).*?,\s*(\d{2,5})x(\d{2,5})/s);
  const fps = err.match(/([\d.]+)\s*fps/);
  const aud = err.match(/Stream #\d+:\d+.*?: Audio:\s*([a-z0-9]+)[^\n]*/);
  const br = err.match(/bitrate:\s*(\d+)\s*kb\/s/);
  return {
    seconds: dur ? (+dur[1] * 3600 + +dur[2] * 60 + parseFloat(dur[3])) : null,
    codec: vid ? vid[1] : null,
    w: vid ? +vid[2] : null,
    h: vid ? +vid[3] : null,
    fps: fps ? parseFloat(fps[1]) : null,
    audio: aud ? aud[1] : null,
    audioLine: aud ? aud[0].replace(/^\s*/, '') : null,
    kbps: br ? +br[1] : null,
  };
}

/* the cuts. ffmpeg scores every frame against the one before it and the score
   is thresholded here rather than inside the filter, so the report can print
   what it rejected as well as what it took. */
function sceneCuts(file, threshold) {
  /* -vf, not -filter_complex: a complex graph needs an explicit -map, and
     without one nothing reaches the null muxer, so the pass runs, prints
     nothing, and reports a video with no cuts in it. that failure looks exactly
     like a correct answer, which is what makes it worth a comment.

     the floor here is 0.002 rather than the threshold, so the report can show
     what it nearly took as well as what it took. a caption clip on a flat
     background scores in the thousandths the whole way through and its real
     cuts are the only thing above a hundredth. */
  const { out } = ffRun(['-i', file, '-vf',
    "select='gt(scene,0.002)',metadata=print:file=-", '-an', '-f', 'null', '-']);
  const cuts = [];
  let t = null;
  for (const line of out.split('\n')) {
    const p = line.match(/pts_time:([\d.]+)/);
    if (p) { t = parseFloat(p[1]); continue; }
    const s = line.match(/lavfi\.scene_score=([\d.]+)/);
    if (s && t !== null) { cuts.push({ t: +t.toFixed(3), score: +parseFloat(s[1]).toFixed(3) }); t = null; }
  }
  return {
    all: cuts,
    taken: cuts.filter(c => c.score >= threshold),
  };
}

/* the audio, at what the transcriber wants: 16k mono pcm. */
function extractAudio(file, wav) {
  const r = ffRun(['-y', '-loglevel', 'error', '-i', file, '-vn',
    '-acodec', 'pcm_s16le', '-ar', '16000', '-ac', '1', wav]);
  return r.code === 0 && fs.existsSync(wav);
}

/* the fallback, and it is a real one. silencedetect splits the track into
   speech and pause, which is the rhythm of the delivery: phrase lengths, breath
   lengths, and when the talking actually starts relative to the first frame.
   most of what a skeleton needs is in here even with no words at all. */
function speechRuns(wav, seconds) {
  const { err } = ffRun(['-i', wav, '-af', 'silencedetect=noise=-32dB:d=0.30', '-f', 'null', '-']);
  const marks = [];
  for (const line of err.split('\n')) {
    const a = line.match(/silence_start:\s*(-?[\d.]+)/);
    if (a) marks.push({ kind: 'start', t: Math.max(0, parseFloat(a[1])) });
    const b = line.match(/silence_end:\s*([\d.]+)/);
    if (b) marks.push({ kind: 'end', t: parseFloat(b[1]) });
  }
  const runs = [];
  let at = 0;
  for (const m of marks) {
    if (m.kind === 'start') { if (m.t > at + 0.05) runs.push([+at.toFixed(2), +m.t.toFixed(2)]); }
    else at = m.t;
  }
  if (seconds > at + 0.05) runs.push([+at.toFixed(2), +seconds.toFixed(2)]);
  return runs;
}

/* ---------- the transcriber ----------
   faster-whisper, in its own virtualenv, driven by a script written out at run
   time. the script is here rather than in a tracked .py file because it is
   fifteen lines and because a python file sitting in a repo that has no python
   in it is a thing somebody will one day try to import. */
const WHISPER_PY = `import json, sys
from faster_whisper import WhisperModel

wav, model_name, root = sys.argv[1], sys.argv[2], sys.argv[3]
# int8 on the cpu. this runs on a laptop while something else is rendering, and
# a reference clip is a minute long, not an hour.
model = WhisperModel(model_name, device="cpu", compute_type="int8", download_root=root)
segments, info = model.transcribe(wav, word_timestamps=True, vad_filter=True)
out = {"language": info.language, "probability": info.language_probability, "segments": []}
for s in segments:
    out["segments"].append({
        "start": round(s.start, 3), "end": round(s.end, 3), "text": s.text.strip(),
        "words": [{"word": w.word.strip(), "start": round(w.start, 3),
                   "end": round(w.end, 3), "p": round(w.probability, 3)}
                  for w in (s.words or []) if w.word.strip()],
    })
print(json.dumps(out))
`;

function whisperPython() {
  if (fs.existsSync(VENV_PY)) return VENV_PY;
  /* a system python that already has it is just as good. */
  for (const py of ['python', 'python3']) {
    const r = spawnSync(py, ['-c', 'import faster_whisper'], { encoding: 'utf8' });
    if (r.status === 0) return py;
  }
  return null;
}

function installWhisper() {
  console.log('  building a virtualenv under ' + path.relative(ROOT, VENV));
  const py = spawnSync('python', ['-m', 'venv', VENV], { stdio: 'inherit' });
  if (py.status !== 0) throw new Error('python -m venv failed. is python on the path?');
  console.log('  installing faster-whisper (about half a gigabyte, once)');
  const pip = spawnSync(VENV_PY, ['-m', 'pip', 'install', '--quiet', '--no-input', 'faster-whisper'],
    { stdio: 'inherit' });
  if (pip.status !== 0) throw new Error('pip install faster-whisper failed');
  console.log('  done. it lives under out/, which is gitignored, so deleting out/ undoes this.');
}

function transcribe(wav, model) {
  const py = whisperPython();
  if (!py) return { engine: null, why: 'faster-whisper is not installed. run node analyze.mjs --install-whisper' };
  fs.mkdirSync(OUT, { recursive: true });
  const script = path.join(OUT, '.whisper.py');
  fs.writeFileSync(script, WHISPER_PY);
  const t0 = Date.now();
  const r = spawnSync(py, [script, wav, model, MODELS], {
    encoding: 'utf8', maxBuffer: 1 << 28,
    /* twenty minutes is more than any reference clip needs on a cpu, and it is
       here so a hang is a failure rather than a wait. the hub timeouts are the
       reason it is needed at all: huggingface_hub retries a download it cannot
       reach with a long backoff, so a blocked network turns a five second
       failure into a quarter of an hour of nothing. */
    timeout: 20 * 60 * 1000,
    env: { ...process.env, HF_HUB_DOWNLOAD_TIMEOUT: '20', HF_HUB_ETAG_TIMEOUT: '10', HF_HUB_DISABLE_TELEMETRY: '1' },
  });
  if (r.status !== 0) {
    const err = (r.stderr || '').trim();
    /* the failure worth naming on its own. the weights are not in the package:
       the first run fetches them from huggingface into out/whisper-models, and
       a machine that is offline, behind a proxy, or on a network that
       allowlists hosts gets back an error about a hub rather than about audio.
       everything else here still works, so this says what to do next instead of
       printing a python stack. */
    if (/LocalEntryNotFound|ConnectError|ConnectionError|proxy|huggingface/i.test(err)) {
      return {
        engine: null,
        why: 'faster-whisper is installed but could not fetch the "' + model + '" model. '
          + 'the weights live on huggingface and the first run downloads them into '
          + 'out/whisper-models; this machine could not reach it. fetch the model on a '
          + 'network that can, or run with --no-whisper and read the phrase rhythm instead.',
      };
    }
    return { engine: null, why: 'faster-whisper failed: ' + err.split('\n').slice(-3).join(' ') };
  }
  let parsed;
  try { parsed = JSON.parse(r.stdout); }
  catch { return { engine: null, why: 'faster-whisper printed something that is not json' }; }
  const words = parsed.segments.flatMap(s => s.words);
  return {
    engine: 'faster-whisper/' + model,
    seconds: (Date.now() - t0) / 1000,
    language: parsed.language, probability: parsed.probability,
    segments: parsed.segments, words,
  };
}

/* ---------- the frame ----------
   stills at every cut and on a cadence, then either tesseract or an edge
   density reading per third. the second one does not read text and does not
   pretend to: it says which band of the frame is carrying detail, which is
   enough to tell a talking head from a full screen caption. */
function haveTesseract() {
  const r = spawnSync('tesseract', ['--version'], { encoding: 'utf8' });
  return r.status === 0;
}

function grabFrames(file, times, dir) {
  fs.mkdirSync(dir, { recursive: true });
  const made = [];
  for (const t of times) {
    const name = 't' + t.toFixed(2).replace('.', '_') + '.jpg';
    const to = path.join(dir, name);
    /* -ss before -i seeks by keyframe and is fast; that is the right trade for
       a still meant to represent a shot rather than a specific frame. */
    const r = ffRun(['-y', '-loglevel', 'error', '-ss', String(t), '-i', file,
      '-frames:v', '1', '-q:v', '3', to]);
    if (r.code === 0 && fs.existsSync(to)) made.push({ t, file: to, name });
  }
  return made;
}

/* how much edge there is in the top, middle and bottom third. edgedetect turns
   the frame into white lines on black, and signalstats' YAVG over a crop is
   then a plain number for "how much is going on here". text is edges. */
function bandInk(frame, w, h) {
  const bands = [['top', 0], ['middle', 1], ['bottom', 2]];
  const out = {};
  for (const [name, i] of bands) {
    const bh = Math.floor(h / 3);
    const { out: so } = ffRun(['-i', frame, '-vf',
      'crop=' + w + ':' + bh + ':0:' + (i * bh) + ',edgedetect=low=0.06:high=0.18,'
      + 'signalstats,metadata=print:file=-', '-f', 'null', '-']);
    const m = so.match(/lavfi\.signalstats\.YAVG=([\d.]+)/);
    out[name] = m ? +parseFloat(m[1]).toFixed(2) : null;
  }
  return out;
}

function ocr(frame) {
  const r = spawnSync('tesseract', [frame, 'stdout', '--psm', '11'], { encoding: 'utf8' });
  if (r.status !== 0) return null;
  return (r.stdout || '').split('\n').map(s => s.trim()).filter(s => s.length > 2);
}

/* ---------- the report ---------- */
const f2 = n => (n === null || n === undefined ? '?' : n.toFixed(2));
const bar = (v, max, width = 24) =>
  '█'.repeat(Math.max(1, Math.round((v / (max || 1)) * width)));

function report(name, file, data) {
  const L = [];
  const P = data.probe;
  L.push('# ' + name);
  L.push('');
  L.push('what this reference is made of, read off the file. nothing here is copy, it is');
  L.push('structure: where it cuts, when it talks, where the ink sits. the last two');
  L.push('sections are the part to build against.');
  L.push('');
  L.push('    source     ' + file);
  L.push('    read       ' + data.stamp);
  L.push('    transcript ' + (data.tx.engine || 'none. ' + data.tx.why));
  L.push('    on screen  ' + data.screenMethod);
  L.push('');

  L.push('## the file');
  L.push('');
  L.push('| | |');
  L.push('|---|---|');
  L.push('| duration | ' + f2(P.seconds) + 's |');
  L.push('| frame | ' + P.w + 'x' + P.h + ' at ' + f2(P.fps) + 'fps, ' + (P.codec || '?') + ' |');
  L.push('| shape | ' + (P.w && P.h ? (P.h > P.w ? 'vertical ' : P.h === P.w ? 'square ' : 'landscape ')
    + (P.w / P.h).toFixed(3) + ':1' : '?') + ' |');
  L.push('| sound | ' + (P.audio ? P.audioLine : 'none') + ' |');
  L.push('| bitrate | ' + (P.kbps ? P.kbps + ' kb/s' : '?') + ' |');
  L.push('');

  /* ---- the cuts ---- */
  const cuts = data.cuts.taken;
  const marks = [0, ...cuts.map(c => c.t)];
  const shots = marks.map((t, i) => ({
    at: t, len: +((i + 1 < marks.length ? marks[i + 1] : P.seconds) - t).toFixed(2),
    score: i ? cuts[i - 1].score : null,
  }));
  const lens = shots.map(s => s.len).sort((a, b) => a - b);
  const median = lens.length ? lens[lens.length >> 1] : 0;
  L.push('## the shape');
  L.push('');
  L.push(cuts.length
    ? cuts.length + ' cuts over ' + f2(P.seconds) + 's, one every '
      + (P.seconds / (cuts.length + 1)).toFixed(2) + 's on average and '
      + median.toFixed(2) + 's at the median. shot lengths, in order:'
    : 'no cuts over the ' + data.threshold + ' threshold. it is one shot, or the cuts are '
      + 'softer than the threshold — the scores below say which.');
  L.push('');
  const longest = Math.max(...shots.map(s => s.len), 0.01);
  for (let i = 0; i < shots.length; i++) {
    const s = shots[i];
    L.push('    ' + String(i + 1).padStart(2) + '  ' + f2(s.at).padStart(6) + 's  '
      + f2(s.len).padStart(5) + 's  ' + bar(s.len, longest)
      + (s.score !== null ? '  (cut scored ' + s.score.toFixed(2) + ')' : ''));
  }
  L.push('');
  const near = data.cuts.all.filter(c => c.score < data.threshold && c.score > data.threshold * 0.6);
  if (near.length) {
    L.push('close but not taken at a ' + data.threshold + ' threshold, in case the threshold is wrong: '
      + near.slice(0, 12).map(c => f2(c.t) + 's/' + c.score.toFixed(2)).join(', ')
      + (near.length > 12 ? ', and ' + (near.length - 12) + ' more' : '') + '.');
    L.push('');
  }

  /* ---- the hook ---- */
  L.push('## the hook');
  L.push('');
  const firstThree = cuts.filter(c => c.t <= 3).length;
  L.push('the first three seconds, which is all the reach a feed gives it:');
  L.push('');
  L.push('- ' + (firstThree ? firstThree + ' cut(s), the first at ' + f2(cuts[0].t) + 's'
    : 'no cut. it holds one frame.'));
  if (data.tx.words && data.tx.words.length) {
    const w0 = data.tx.words[0];
    const inThree = data.tx.words.filter(w => w.start < 3);
    L.push('- the first word lands at ' + f2(w0.start) + 's: "' + w0.word + '"');
    L.push('- ' + inThree.length + ' words are said inside three seconds ('
      + (inThree.length / 3).toFixed(2) + ' a second)');
    L.push('- the opening line: "' + data.tx.segments[0].text + '"');
  } else if (data.runs && data.runs.length) {
    L.push('- the talking starts at ' + f2(data.runs[0][0]) + 's and the first phrase runs '
      + f2(data.runs[0][1] - data.runs[0][0]) + 's');
  } else {
    L.push('- no sound to read. whatever the hook is, it is visual.');
  }
  L.push('- the frame at 0.30s is ' + path.basename(data.frames[0] ? data.frames[0].name : 'not sampled'));
  L.push('');

  /* ---- the voice ---- */
  L.push('## the voice');
  L.push('');
  if (data.tx.words && data.tx.words.length) {
    const ws = data.tx.words;
    const talk = ws[ws.length - 1].end - ws[0].start;
    const gaps = ws.slice(1).map((w, i) => +(w.start - ws[i].end).toFixed(2));
    const big = gaps.map((g, i) => ({ g, at: ws[i].end })).filter(x => x.g > 0.45)
      .sort((a, b) => b.g - a.g).slice(0, 6);
    L.push('- ' + ws.length + ' words over ' + f2(talk) + 's of talking, '
      + (ws.length / talk).toFixed(2) + ' a second');
    L.push('- ' + f2(100 * talk / P.seconds) + '% of the clip has a voice on it');
    L.push('- language ' + (data.tx.probability === null || data.tx.probability === undefined
      ? data.tx.language
      : 'read as ' + data.tx.language + ' at ' + (data.tx.probability * 100).toFixed(0) + '% confidence'));
    if (big.length) {
      L.push('- the pauses it leaves: ' + big.map(x => f2(x.g) + 's at ' + f2(x.at) + 's').join(', '));
    }
    L.push('');
    L.push('the sentences, with the frame they start on:');
    L.push('');
    for (const s of data.tx.segments) {
      L.push('    ' + f2(s.start).padStart(6) + 's  ' + f2(s.end - s.start).padStart(5)
        + 's  ' + s.text);
    }
  } else if (data.runs && data.runs.length) {
    const total = data.runs.reduce((a, r) => a + r[1] - r[0], 0);
    L.push('no transcript, so this is the rhythm rather than the words. '
      + data.runs.length + ' phrases, ' + f2(total) + 's of speech in '
      + f2(P.seconds) + 's (' + f2(100 * total / P.seconds) + '%), median phrase '
      + f2(data.runs.map(r => r[1] - r[0]).sort((a, b) => a - b)[data.runs.length >> 1]) + 's.');
    L.push('');
    for (const [a, b] of data.runs) {
      L.push('    ' + f2(a).padStart(6) + 's  ' + f2(b - a).padStart(5) + 's  ' + bar(b - a, P.seconds, 30));
    }
  } else {
    L.push('there is no audio track, or nothing above the noise floor in it.');
  }
  L.push('');

  /* ---- the caption cut ---- */
  L.push('## the caption cut, in our engine');
  L.push('');
  if (data.plans) {
    L.push('the same words, grouped the way `lib/captions.mjs` would group them. this is the');
    L.push('bit to argue with: if the reference feels faster than this, the card size or the');
    L.push('hold is what to change, not the copy.');
    L.push('');
    for (const [style, text] of Object.entries(data.plans)) {
      L.push('**' + style + '**');
      L.push('');
      L.push('```');
      L.push(text);
      L.push('```');
      L.push('');
    }
  } else {
    L.push('nothing to cut: there are no word timestamps. install the transcriber and run');
    L.push('this again, or write the line yourself and let `lib/voice.mjs` time it.');
    L.push('');
  }

  /* ---- the frame ---- */
  L.push('## what is on screen');
  L.push('');
  L.push(data.screenMethod);
  L.push('');
  if (data.tesseract) {
    for (const fr of data.frames) {
      L.push('    ' + f2(fr.t).padStart(6) + 's  ' + (fr.text && fr.text.length ? fr.text.join(' / ') : '(nothing read)'));
    }
  } else {
    L.push('    time      top     middle  bottom   where the detail is');
    for (const fr of data.frames) {
      const b = fr.ink || {};
      const vals = [b.top, b.middle, b.bottom];
      const best = vals.indexOf(Math.max(...vals.map(v => v === null ? -1 : v)));
      L.push('    ' + f2(fr.t).padStart(6) + 's  '
        + String(b.top).padStart(6) + '  ' + String(b.middle).padStart(6) + '  '
        + String(b.bottom).padStart(6) + '   ' + ['top', 'middle', 'bottom'][best] + ' third');
    }
  }
  L.push('');
  L.push('the stills are next to this file, in `' + path.basename(data.frameDir) + '/`.');
  L.push('');

  /* ---- the summary ---- */
  L.push('## what to build to');
  L.push('');
  const wps = data.tx.words && data.tx.words.length
    ? data.tx.words.length / (data.tx.words[data.tx.words.length - 1].end - data.tx.words[0].start)
    : null;
  L.push('- **length** ' + f2(P.seconds) + 's, ' + (P.h > P.w ? 'vertical' : P.h === P.w ? 'square' : 'landscape'));
  L.push('- **cut rate** ' + (cuts.length ? 'one every ' + (P.seconds / (cuts.length + 1)).toFixed(2)
    + 's, median shot ' + median.toFixed(2) + 's' : 'no cuts at all'));
  L.push('- **hook** ' + (data.tx.words && data.tx.words.length
    ? 'first word at ' + f2(data.tx.words[0].start) + 's'
    : data.runs && data.runs.length ? 'first sound at ' + f2(data.runs[0][0]) + 's' : 'silent'));
  L.push('- **pace** ' + (wps ? wps.toFixed(2) + ' words a second, so a three word card holds '
    + (3 / wps).toFixed(2) + 's' : 'unknown without a transcript'));
  L.push('- **our voices run** ' + (wps
    ? 'about 2.3 words a second at the default rate, so this reference is '
      + (wps > 2.3 ? (wps / 2.3).toFixed(2) + 'x faster than us. drop the rate flag or cut words.'
        : (2.3 / wps).toFixed(2) + 'x slower than us. we can afford the extra word.')
    : 'about 2.3 words a second at the default rate'));
  L.push('');
  L.push('nothing above is copy and nothing above is a shot. it is a skeleton, and the');
  L.push('next clip gets built onto it in our type, our green and our words.');
  L.push('');
  return L.join('\n');
}

/* ---------- go ---------- */
if (flags['install-whisper']) {
  installWhisper();
  process.exit(0);
}

const input = rest[0];
if (!input) {
  console.error('usage: node analyze.mjs <video file> [--model=base] [--scene=0.28]'
    + ' [--no-whisper] [--words=words.json]');
  process.exit(1);
}
const file = path.resolve(input);
if (!fs.existsSync(file)) throw new Error('no file at ' + file);

const name = path.basename(file).replace(/\.[^.]+$/, '');
const threshold = Number(flags.scene || 0.28);
const model = String(flags.model || 'base');
fs.mkdirSync(OUT, { recursive: true });
const frameDir = path.join(OUT, name);

console.log('the boring tek — reference analyzer');
console.log('  ' + path.relative(ROOT, file));

const P = probe(file);
if (!P.seconds) throw new Error('ffmpeg could not read a duration out of that file');
console.log('  ' + P.w + 'x' + P.h + ' @' + f2(P.fps) + 'fps, ' + f2(P.seconds) + 's, '
  + (P.audio ? 'audio: ' + P.audio : 'no audio'));

const cuts = sceneCuts(file, threshold);
console.log('  ' + cuts.taken.length + ' cuts at or over ' + threshold
  + ' (' + cuts.all.length + ' frames scored anything at all)');

let tx = { engine: null, why: 'not attempted' };
let runs = null;

/* a word list you already have beats one a model guessed at. `--words` takes
   either the sidecar lib/voice.mjs writes next to every mp3, or a bare array of
   {word, start, end}. this is the normal case for anything we scripted
   ourselves, and it is also how the rest of the report gets exercised on a
   machine that cannot reach the model weights. */
if (flags.words) {
  const raw = JSON.parse(fs.readFileSync(path.resolve(String(flags.words)), 'utf8'));
  const words = Array.isArray(raw) ? raw : raw.words;
  if (!Array.isArray(words) || !words.length) throw new Error('--words has no word list in it');
  tx = {
    engine: 'a word list from ' + path.basename(String(flags.words)) + ', not a transcription',
    seconds: 0,
    language: raw.voice ? 'en (the line is ours)' : 'not detected',
    probability: null,
    words,
    segments: sentencesOf(words).map(s => ({ start: s.start, end: s.end, text: s.text })),
  };
  console.log('  ' + words.length + ' words read from ' + path.basename(String(flags.words)));
}

if (P.audio) {
  const wav = path.join(OUT, name + '.wav');
  if (extractAudio(file, wav)) {
    runs = speechRuns(wav, P.seconds);
    console.log('  ' + runs.length + ' phrases between the silences');
    if (!flags['no-whisper'] && !flags.words) {
      process.stdout.write('  transcribing with faster-whisper (' + model + ') ... ');
      tx = transcribe(wav, model);
      console.log(tx.engine ? tx.words.length + ' words in ' + f2(tx.seconds) + 's' : 'no. ' + tx.why);
    } else if (!flags.words) {
      tx = { engine: null, why: 'skipped with --no-whisper' };
    }
    fs.rmSync(wav, { force: true });
  }
} else if (!flags.words) {
  tx = { engine: null, why: 'the file has no audio track' };
}

/* the stills: one just after the start, one just after every cut, and a fixed
   cadence on top so a long shot is still sampled more than once. */
const times = new Set([0.3]);
for (const c of cuts.taken) times.add(+(c.t + 0.12).toFixed(2));
for (let t = 1; t < P.seconds - 0.2; t += Math.max(1.5, P.seconds / 10)) times.add(+t.toFixed(2));
const wanted = [...times].filter(t => t > 0 && t < P.seconds - 0.05).sort((a, b) => a - b).slice(0, 16);
const frames = grabFrames(file, wanted, frameDir);
console.log('  ' + frames.length + ' stills into ' + path.relative(ROOT, frameDir));

const tess = haveTesseract();
for (const fr of frames) {
  if (tess) fr.text = ocr(fr.file);
  else fr.ink = bandInk(fr.file, P.w, P.h);
}
const screenMethod = tess
  ? 'read with tesseract, at psm 11. what it says is what it read, misreadings included.'
  : 'tesseract is not on this machine, so this is not ocr. it is the edge density of each '
  + 'third of the frame: a higher number means more detail in that band, which is where '
  + 'the captions or the face are. install tesseract and run it again for the actual words.';
console.log('  on screen: ' + (tess ? 'tesseract' : 'edge density per third, no ocr'));

/* the words, cut the way our own engine would cut them. this is the section
   that turns a reading into something to build against. */
let plans = null;
if (tx.words && tx.words.length) {
  plans = {};
  for (const style of ['pop', 'type']) {
    try {
      /* a transcript is somebody else's copy and may well contain a dash, which
         our own copy never may. so it is stripped for the purpose of showing
         the cut rather than throwing on it: this section is a measurement of
         the reference, not a line we are about to ship. */
      const words = tx.words.map(w => ({
        word: w.word.replace(/[‐-―−]/g, ' ').replace(/\s+/g, ' ').trim() || '.',
        start: w.start, end: Math.max(w.end, w.start + 0.02),
      }));
      plans[style] = describe(planCaptions(words, { style }));
    } catch (e) {
      plans[style] = 'could not cut this transcript: ' + e.message;
    }
  }
}

const md = report(name, path.relative(ROOT, file), {
  probe: P, cuts, threshold, tx, runs, frames, frameDir, tesseract: tess,
  screenMethod, plans, stamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + 'Z',
});
const to = path.join(OUT, name + '.md');
fs.writeFileSync(to, md);
console.log('\n  ' + path.relative(ROOT, to) + '  (' + md.split('\n').length + ' lines)');
