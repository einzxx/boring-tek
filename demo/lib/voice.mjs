/* the boring tek — free voice. edge tts, no account, no key, no dependency.

   what this is. microsoft's edge browser has a read aloud feature, and the
   neural voices behind it answer to an unauthenticated websocket. that is what
   moneyprinterturbo and every other free pipeline uses, usually through the
   python `edge-tts` package. this file is the same protocol written out, so
   demo/ keeps its two devDependencies and gains no third.

   why it is hand rolled rather than `npm i edge-tts`. two reasons, and the
   second is the real one.

   1. node 24 already ships a global WebSocket, so a package would only be
      wrapping a protocol that is four messages long.
   2. the global WebSocket cannot set request headers, and this endpoint wants
      an Origin and a User-Agent that say edge. so the handshake is written
      against a tls socket here and the frames are masked by hand. it is about
      a hundred lines and it is the only way to send those headers without
      pulling in `ws`.

   the drm, because it will break one day and this is the note that saves the
   afternoon. since 2024 the endpoint rejects a connection that does not carry
   `Sec-MS-GEC`: sha256, uppercase hex, of the current windows file time rounded
   down to five minutes, in 100ns ticks, with the public trusted client token
   appended. two traps in that sentence. the ticks are past 2^53 so they have to
   be computed in BigInt or javascript quietly rounds them and every hash is
   wrong, and the clock is the *server's*, so a machine a few minutes off is
   refused. a 403 therefore retries once against the Date header the refusal
   itself carries, which is what `edge-tts` does too.

   what it gives back, and why that matters here. the service emits a
   WordBoundary event per word: an offset and a duration in the same 100ns
   ticks. that is a real timestamped transcript of a line we wrote, straight out
   of the synthesiser, and it is exactly the `{word, start, end}` array
   `captions.mjs` eats. no alignment pass, no whisper, no guessing. when a voice
   ever comes back without them, `estimate()` below spreads the words over the
   measured duration by length and punctuation instead, and the caller is told
   which of the two it got.

   nothing here is wired into a post script. it writes audio into
   demo/out/voice/, which is inside demo/out/ and therefore already gitignored,
   and no clip reads it yet.

     node lib/voice.mjs test                 a sample line, and its duration
     node lib/voice.mjs test "some copy"     the same for your own line
     node lib/voice.mjs voices               the four we picked, and why
     node lib/voice.mjs say "copy" --voice=dry --format=wav --name=post6
*/

import tls from 'node:tls';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEMO = path.resolve(HERE, '..');
export const VOICE_OUT = path.join(DEMO, 'out', 'voice');

/* ---------- the endpoint ----------
   the token is public: it is compiled into edge and printed in every article
   about this api. it is not a secret and it is not ours, so it is fine in a
   public repo. the version string is a real edge build number and is only ever
   compared for shape. */
const TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const HOST = 'speech.platform.bing.com';
const BASE = '/consumer/speech/synthesize/readaloud/edge/v1';
/* these two track a real edge build and are the first thing to bump when the
   endpoint starts answering 403 to a correct token. the python edge-tts package
   carries the same pair in its constants.py, so that file is the reference. */
const CHROMIUM_FULL = '143.0.3650.75';
const GEC_VERSION = '1-' + CHROMIUM_FULL;
const CHROME_VERSION = CHROMIUM_FULL.split('.')[0] + '.0.0.0';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
  + '(KHTML, like Gecko) Chrome/' + CHROME_VERSION + ' Safari/537.36 Edg/' + CHROME_VERSION;
/* edge's own read aloud extension id. the endpoint checks the origin. */
const ORIGIN = 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold';

/* ---------- the voices ----------
   twenty two english voices answer this endpoint. the first three are the ones
   that can read our copy without selling it, and the fourth is a comedy voice
   that never reads our copy at all. the brand is deadpan, lowercase and
   short, so anything cheerful, breathy or "expressive" is wrong however good it
   sounds: the line `we delete the manual work` has to land flat.

   the default is deliberately the plainest of the three. rate is negative on
   all of them because the neural default is a shade faster than a person
   reading a short line to camera, and because a caption has to keep up. */
export const VOICES = {
  calm: {
    id: 'en-US-AndrewNeural', rate: '-8%', pitch: '-2Hz',
    note: 'the default. male, us, warm and unhurried. reads a statement as a '
      + 'statement rather than as an offer.',
  },
  dry: {
    id: 'en-US-EricNeural', rate: '-10%', pitch: '-4Hz',
    note: 'flatter and older. microsoft files it under rational, which is the '
      + 'closest thing in the list to deadpan. for a line that is a fact.',
  },
  uk: {
    id: 'en-GB-RyanNeural', rate: '-6%', pitch: '0Hz',
    note: 'male, british. the same register in a different accent, for when a '
      + 'clip should not sound american. we are in riga, not in california.',
  },
  /* the fourth, added 2026-08-30, and the only one in the list that is not the
     narrator. the three above are the agency talking; this one is for a line
     somebody *else* is thinking: post11 types `i want ai to do my job but keep
     my salary` into a form and that sentence is not ours to say.

     **it was `en-IN-PrabhatNeural` for about an hour and it is not any more.**
     the first build read the line in indian english, which was a real accent
     read by a real neural voice and was still the wrong call: a clip whose
     whole register is deadpan and plain does not want its one joke marked out
     by an accent, because the accent then becomes the joke. so it is a us woman
     now, read light and warm, and the line is funny for what it says rather
     than for who is saying it. that is the whole reasoning, and it is why the
     id changed rather than the slot.

     it is female on purpose and that is the second half of the same argument:
     the three narrators are all male, so the one voice that is somebody else in
     the film reads as somebody else on the first syllable with nothing to do
     but be a different person.

     `comedy: true` is on it so nothing can pick it as a narrator by accident,
     and `NARRATORS` below is every voice that is not marked. */
  aside: {
    id: 'en-US-JennyNeural', rate: '+2%', pitch: '0Hz', comedy: true,
    note: 'female, us. the comedy voice, and the only one that is not the '
      + 'agency speaking: for a line a person in the film is thinking. light '
      + 'and warm, never played for the joke.',
  },
};
export const DEFAULT_VOICE = 'calm';
/* the narrators, which is every voice that is not marked as comedy. a clip
   picking a read voice picks from this. */
export const NARRATORS = Object.keys(VOICES).filter(k => !VOICES[k].comedy);

/* ---------- the drm token ----------
   windows file time is seconds since 1601 in 100ns ticks. rounded down to five
   minutes, times 1e7, which is past Number.MAX_SAFE_INTEGER — so BigInt, or
   every hash silently comes out wrong and the endpoint says 403 with no reason
   attached. skew is applied in seconds and is how a 403 gets a second chance. */
function gec(skewSeconds = 0) {
  let ticks = BigInt(Math.floor(Date.now() / 1000) + Math.round(skewSeconds) + 11644473600);
  ticks -= ticks % 300n;
  ticks *= 10000000n;
  return crypto.createHash('sha256').update(String(ticks) + TOKEN, 'ascii').digest('hex').toUpperCase();
}

/* ---------- a websocket, by hand ----------
   rfc 6455, the half of it this needs: an http upgrade with the headers the
   global WebSocket will not let us set, unmasked frames in, masked frames out,
   a pong for every ping, and nothing else. no extensions are offered, so
   nothing arrives deflated and a frame is a frame. */
function frame(opcode, payload) {
  const len = payload.length;
  const head = len < 126 ? 2 : len < 65536 ? 4 : 10;
  const buf = Buffer.alloc(head + 4 + len);
  buf[0] = 0x80 | opcode;                       /* fin, one frame per message */
  if (len < 126) buf[1] = 0x80 | len;
  else if (len < 65536) { buf[1] = 0x80 | 126; buf.writeUInt16BE(len, 2); }
  else { buf[1] = 0x80 | 127; buf.writeBigUInt64BE(BigInt(len), 2); }
  const mask = crypto.randomBytes(4);
  mask.copy(buf, head);
  for (let i = 0; i < len; i++) buf[head + 4 + i] = payload[i] ^ mask[i & 3];
  return buf;
}

/* the reader. server frames are never masked, and a long message can arrive
   fragmented, so continuation frames are stitched onto whatever opcode opened
   the message. returns whole messages, never pieces. */
function reader(onMessage, onPing) {
  let buf = Buffer.alloc(0);
  let op = 0, parts = [];
  return chunk => {
    buf = Buffer.concat([buf, chunk]);
    for (;;) {
      if (buf.length < 2) return;
      const fin = (buf[0] & 0x80) !== 0, opcode = buf[0] & 0x0f;
      const masked = (buf[1] & 0x80) !== 0;
      let len = buf[1] & 0x7f, off = 2;
      if (len === 126) { if (buf.length < 4) return; len = buf.readUInt16BE(2); off = 4; }
      else if (len === 127) { if (buf.length < 10) return; len = Number(buf.readBigUInt64BE(2)); off = 10; }
      if (masked) off += 4;                       /* a server must not, but read it if it does */
      if (buf.length < off + len) return;
      const body = buf.subarray(off, off + len);
      buf = buf.subarray(off + len);
      if (opcode === 0x9) { onPing(body); continue; }
      if (opcode === 0xa) continue;
      if (opcode === 0x8) { onMessage('close', body); return; }
      if (opcode !== 0x0) { op = opcode; parts = []; }
      parts.push(Buffer.from(body));
      if (!fin) continue;
      onMessage(op === 0x1 ? 'text' : 'binary', Buffer.concat(parts));
      parts = [];
    }
  };
}

/* connect, or throw with the status line the server actually sent. a 403 is by
   far the likeliest failure and it carries a Date header, which is the clock
   the token has to agree with, so the caller retries against it. */
function connect(query) {
  return new Promise((resolve, reject) => {
    const key = crypto.randomBytes(16).toString('base64');
    const accept = crypto.createHash('sha1')
      .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
    const socket = tls.connect({ host: HOST, port: 443, servername: HOST }, () => {
      /* the header block is edge's, header for header. the two that are easy to
         leave out and fatal to leave out are the Origin, which names the read
         aloud extension, and the muid Cookie: a connection without a machine id
         is refused with the same blank 403 a bad token gets, so a missing cookie
         looks exactly like broken drm and costs an afternoon. the muid is a
         random 16 bytes per connection and identifies nothing about us. */
      socket.write('GET ' + BASE + '?' + query + ' HTTP/1.1\r\n'
        + 'Host: ' + HOST + '\r\n'
        + 'Upgrade: websocket\r\n'
        + 'Connection: Upgrade\r\n'
        + 'Sec-WebSocket-Key: ' + key + '\r\n'
        + 'Sec-WebSocket-Version: 13\r\n'
        + 'Pragma: no-cache\r\n'
        + 'Cache-Control: no-cache\r\n'
        + 'Origin: ' + ORIGIN + '\r\n'
        + 'User-Agent: ' + UA + '\r\n'
        + 'Accept-Encoding: gzip, deflate, br, zstd\r\n'
        + 'Accept-Language: en-US,en;q=0.9\r\n'
        + 'Cookie: muid=' + crypto.randomBytes(16).toString('hex').toUpperCase() + ';\r\n'
        + '\r\n');
    });
    socket.setTimeout(30000, () => { socket.destroy(); reject(new Error('the endpoint did not answer in 30s')); });
    let head = Buffer.alloc(0), upgraded = false;
    socket.on('error', e => { if (!upgraded) reject(e); });
    socket.on('data', chunk => {
      if (upgraded) return;
      head = Buffer.concat([head, chunk]);
      const i = head.indexOf('\r\n\r\n');
      if (i < 0) { if (head.length > 65536) { socket.destroy(); reject(new Error('handshake never ended')); } return; }
      const text = head.subarray(0, i).toString('latin1');
      const rest = head.subarray(i + 4);
      const status = text.split('\r\n')[0];
      if (!/^HTTP\/1\.1 101/.test(status)) {
        socket.destroy();
        const date = (text.match(/^date:\s*(.+)$/im) || [])[1] || null;
        const err = new Error('the endpoint refused the handshake: ' + status);
        err.status = status; err.serverDate = date;
        return reject(err);
      }
      if (!text.toLowerCase().includes('sec-websocket-accept: ' + accept.toLowerCase())) {
        socket.destroy();
        return reject(new Error('the handshake came back without a matching accept key'));
      }
      upgraded = true;
      socket.setTimeout(0);
      resolve({ socket, rest });
    });
  });
}

/* ---------- ssml ----------
   the copy is ours and short, but it is still going into an xml document, so it
   is escaped rather than trusted. a stray ampersand in a line about r&d would
   otherwise come back as a parse error from a server that does not say so. */
const xml = s => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

function ssmlFor(text, voice) {
  const lang = voice.id.slice(0, 5);
  return "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='" + lang + "'>"
    + "<voice name='" + voice.id + "'>"
    + "<prosody pitch='" + voice.pitch + "' rate='" + voice.rate + "' volume='+0%'>"
    + xml(text)
    + '</prosody></voice></speak>';
}

/* the wire format is always the 48 kbps mp3, whatever file we end up writing.
   the service will send a riff stream instead, and that stream is unusable the
   moment a script needs two requests: every chunk arrives with its own riff
   header and its own length field, so concatenating them makes a file whose
   header says it is a fifth as long as it is. the mp3 is constant bitrate and
   header free, so chunks concatenate exactly and the byte count is a duration.
   wav is therefore a transcode of the finished mp3, with ffmpeg, which is
   already here to encode the clips. */
const WIRE = 'audio-24khz-48kbitrate-mono-mp3';
const WIRE_BPS = 48000;
const FORMATS = {
  mp3: { ext: 'mp3' },
  wav: { ext: 'wav', ffmpeg: ['-acodec', 'pcm_s16le', '-ar', '24000', '-ac', '1'] },
};

/* ---------- one request ----------
   four messages and it is over: speech.config out, ssml out, a run of binary
   audio chunks and audio.metadata text messages back, then turn.end. every
   binary message is two bytes of header length, that many bytes of header, then
   the audio, so the mp3 is the concatenation of the tails. */
function once(text, voice, skewSeconds) {
  return new Promise(async (resolve, reject) => {
    const query = 'TrustedClientToken=' + TOKEN
      + '&ConnectionId=' + crypto.randomUUID().replace(/-/g, '')
      + '&Sec-MS-GEC=' + gec(skewSeconds)
      + '&Sec-MS-GEC-Version=' + GEC_VERSION;
    let conn;
    try { conn = await connect(query); } catch (e) { return reject(e); }
    const { socket, rest } = conn;
    const audio = [], marks = [];
    let settled = false;
    const done = (err, val) => {
      if (settled) return;
      settled = true;
      try { socket.write(frame(0x8, Buffer.alloc(0))); } catch { }
      socket.destroy();
      err ? reject(err) : resolve(val);
    };
    const feed = reader((kind, body) => {
      if (kind === 'close') return done(new Error('the endpoint closed the turn early'));
      if (kind === 'binary') {
        if (body.length < 2) return;
        const headLen = body.readUInt16BE(0);
        audio.push(body.subarray(2 + headLen));
        return;
      }
      const s = body.toString('utf8');
      const p = (s.match(/Path:([a-zA-Z.]+)/) || [])[1];
      if (p === 'audio.metadata') {
        try {
          for (const m of JSON.parse(s.split('\r\n\r\n')[1]).Metadata || []) marks.push(m);
        } catch { }
      } else if (p === 'turn.end') {
        done(null, { audio: Buffer.concat(audio), marks });
      }
    }, pong => { try { socket.write(frame(0xa, pong)); } catch { } });

    socket.on('data', feed);
    socket.on('error', e => done(e));
    socket.on('close', () => done(new Error('the socket closed before turn.end')));
    if (rest.length) feed(rest);

    const stamp = new Date().toString();
    /* word boundaries are the whole point of using this engine, so they are
       asked for and sentence boundaries are not: the service treats the two as
       one choice and answers with whichever is true, so asking for both is how
       you get neither. sentence grouping is derived from the words and their
       punctuation afterwards, which costs nothing and cannot disagree with the
       word timings the captions are actually cut against.

       the trailing \r\n after the json is edge's own and is kept. */
    socket.write(frame(0x1, Buffer.from(
      'X-Timestamp:' + stamp + '\r\n'
      + 'Content-Type:application/json; charset=utf-8\r\n'
      + 'Path:speech.config\r\n\r\n'
      + JSON.stringify({
        context: {
          synthesis: {
            audio: {
              metadataoptions: { sentenceBoundaryEnabled: 'false', wordBoundaryEnabled: 'true' },
              outputFormat: WIRE,
            },
          },
        },
      }) + '\r\n', 'utf8')));
    socket.write(frame(0x1, Buffer.from(
      'X-RequestId:' + crypto.randomUUID().replace(/-/g, '') + '\r\n'
      + 'Content-Type:application/ssml+xml\r\n'
      + 'X-Timestamp:' + stamp + 'Z\r\n'
      + 'Path:ssml\r\n\r\n'
      + ssmlFor(text, voice), 'utf8')));
  });
}

/* ---------- chunking ----------
   one request can carry a long script, but the service is happier with a
   paragraph than with a page, and a dropped connection halfway through a
   two minute read costs the whole read. so anything long is split on sentence
   ends, and every chunk after the first has the running duration added to its
   word offsets. that running total is measured from the audio the previous
   chunks actually produced, not assumed, which is the same trick edge-tts calls
   offset compensation. */
const CHUNK = 900;
function chunkText(text) {
  const clean = String(text).replace(/\s+/g, ' ').trim();
  if (clean.length <= CHUNK) return [clean];
  const out = [];
  let buf = '';
  for (const piece of clean.split(/(?<=[.!?])\s+/)) {
    if (buf && (buf + ' ' + piece).length > CHUNK) { out.push(buf); buf = piece; }
    else buf = buf ? buf + ' ' + piece : piece;
  }
  if (buf) out.push(buf);
  return out;
}

/* ---------- duration ----------
   ffprobe is not in ffmpeg-static, so the duration is read the way the clip
   scripts read theirs: run ffmpeg against the file and parse what it says about
   it on the way to refusing to do nothing. */
function probeSeconds(file) {
  let out = '';
  try { execFileSync(ffmpeg, ['-hide_banner', '-i', file], { stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { out = (e.stderr || '').toString(); }
  const d = out.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
  return d ? (+d[1] * 3600 + +d[2] * 60 + parseFloat(d[3])) : null;
}

/* ---------- the fallback timing ----------
   used when a voice comes back with no word boundaries at all. it is a guess
   and it is labelled as one everywhere it appears: words are spread over the
   measured duration in proportion to their length, with a share of the time
   parked on the punctuation, because a full stop is where a reader actually
   spends it. good enough to cut a caption against, not good enough to trust
   against a waveform. */
export function estimate(text, seconds) {
  const raw = String(text).replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  if (!raw.length || !seconds) return [];
  /* a syllable is closer to the unit of speech than a character is, and vowel
     groups are a decent count of syllables for english. one minimum, always. */
  const weight = w => {
    const bare = w.replace(/[^a-z0-9']/gi, '');
    const syl = Math.max(1, (bare.toLowerCase().match(/[aeiouy]+/g) || []).length);
    const pause = /[.!?]$/.test(w) ? 2.2 : /[,;:]$/.test(w) ? 1.1 : 0;
    return syl + pause;
  };
  const ws = raw.map(weight);
  const total = ws.reduce((a, b) => a + b, 0);
  let t = 0;
  return raw.map((word, i) => {
    const dur = seconds * ws[i] / total;
    const start = t;
    t += dur;
    /* the pause after a stop belongs to the silence, not to the word, so the
       word's own box ends before it. a caption that holds a word through the
       breath after it reads as lag. */
    const spoken = dur / (1 + (/[.!?,;:]$/.test(word) ? 0.55 : 0));
    return { word, start: +start.toFixed(3), end: +(start + spoken).toFixed(3) };
  });
}

/* ---------- punctuation, put back ----------
   the engine's WordBoundary text is the spoken token and nothing else: `parts.`
   comes back as `parts`. a caption cannot lose the full stop — the brand writes
   in short sentences and the stops are most of the rhythm — and neither can the
   sentence grouping under it, which has nothing to split on without them.

   so the boundaries are walked against the copy we sent, in order, and whatever
   punctuation trails the matching token in the source is put back on. a token
   that cannot be found is left exactly as the engine said it, because a
   caption that quietly disagrees with the audio is worse than one missing a
   comma. */
function attachPunctuation(words, text) {
  const src = String(text).replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const bare = s => s.toLowerCase().replace(/[^\p{L}\p{N}']/gu, '');
  let at = 0;
  return words.map(w => {
    const want = bare(w.word);
    if (!want) return w;
    for (let i = at; i < src.length && i < at + 4; i++) {
      const tok = src[i];
      if (bare(tok) !== want) continue;
      at = i + 1;
      const tail = (tok.match(/[^\p{L}\p{N}']+$/u) || [''])[0];
      return tail ? { ...w, word: w.word + tail } : w;
    }
    return w;
  });
}

/* the boundaries the engine sends, turned into the array captions.mjs eats.
   offsets and durations are in 100ns ticks.

   one boundary is not always one word. a figure and its unit come back as a
   single event — `40 hours` arrives as one box with one duration — because the
   engine reads them as one thing. a caption cannot: the counter style needs the
   number on its own, and every style needs a word to light up when it is said
   rather than a phrase. so a boundary carrying whitespace is split back into
   its words and the box is shared out between them by length. that share is a
   guess inside one event, and it is a guess measured in tens of milliseconds
   inside a box the engine already agreed with, which is a different order of
   thing from estimating a whole line. */
function wordsFromMarks(marks) {
  const out = [];
  for (const m of marks) {
    if (m.Type !== 'WordBoundary') continue;
    const d = m.Data || {};
    const text = ((d.text && d.text.Text) || '').trim();
    if (!text) continue;
    const start = Number(d.Offset || 0) / 1e7;
    const dur = Number(d.Duration || 0) / 1e7;
    const parts = text.split(/\s+/);
    if (parts.length === 1) {
      out.push({ word: text, start: +start.toFixed(3), end: +(start + dur).toFixed(3) });
      continue;
    }
    const total = parts.reduce((a, p) => a + p.length, 0);
    let t = start;
    for (const p of parts) {
      const share = dur * p.length / total;
      out.push({ word: p, start: +t.toFixed(3), end: +(t + share).toFixed(3) });
      t += share;
    }
  }
  return out;
}
/* sentences, derived rather than asked for. a full stop, a question mark or an
   exclamation ends one, and the caption engine's calm style breaks on these
   rather than on a word count. derived from the same words the captions use, so
   the two can never disagree by a frame. */
export function sentencesOf(words) {
  const out = [];
  let run = [];
  for (const w of words) {
    run.push(w);
    if (/[.!?]["')\]]?$/.test(w.word)) { out.push(run); run = []; }
  }
  if (run.length) out.push(run);
  return out.map(r => ({
    text: r.map(w => w.word).join(' '),
    start: r[0].start, end: r[r.length - 1].end, words: r.length,
  }));
}

const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'line';

/* ---------- the one call worth knowing ----------
   speak(text) writes an mp3 into demo/out/voice/ and hands back the file, the
   duration measured off that file, and the words with their timestamps. */
export async function speak(text, opts = {}) {
  const key = opts.voice || DEFAULT_VOICE;
  const voice = VOICES[key];
  if (!voice) throw new Error('no voice called "' + key + '". we ship ' + Object.keys(VOICES).join(', '));
  const format = opts.format || 'mp3';
  if (!FORMATS[format]) throw new Error('format is mp3 or wav, not "' + format + '"');
  /* per call overrides, so a clip can slow one line down without a new voice. */
  const v = { id: voice.id, rate: opts.rate || voice.rate, pitch: opts.pitch || voice.pitch };

  const chunks = chunkText(text);
  const audio = [];
  const marks = [];
  let carried = 0;                       /* seconds of audio already written */
  for (const chunk of chunks) {
    let got;
    try {
      got = await once(chunk, v, 0);
    } catch (e) {
      /* the one failure worth a second attempt. the token is a hash of the
         server's clock, so a machine a few minutes out is refused with no
         explanation beyond a Date header — which is the clock we should have
         used. one retry against it, then give up honestly. */
      if (e.serverDate) {
        const skew = (Date.parse(e.serverDate) - Date.now()) / 1000;
        got = await once(chunk, v, skew);
      } else throw e;
    }
    for (const m of got.marks) {
      if (!carried) { marks.push(m); continue; }
      const d = { ...(m.Data || {}) };
      d.Offset = Number(d.Offset || 0) + Math.round(carried * 1e7);
      marks.push({ ...m, Data: d });
    }
    audio.push(got.audio);
    /* how much audio this chunk really produced, so the next chunk's word
       offsets can be pushed along by it. the wire format is constant bitrate,
       so the answer is exact arithmetic on the byte count and needs no probe.
       counting the last word boundary instead would drift, because a chunk ends
       with silence that no word is inside. */
    carried += got.audio.length * 8 / WIRE_BPS;
  }

  const buf = Buffer.concat(audio);
  if (!buf.length) throw new Error('the endpoint sent no audio at all');
  fs.mkdirSync(VOICE_OUT, { recursive: true });
  const name = (opts.name ? slug(opts.name) : slug(text)) + '-' + key;
  let file = path.join(VOICE_OUT, name + '.mp3');
  fs.writeFileSync(file, buf);
  if (format === 'wav') {
    const wav = path.join(VOICE_OUT, name + '.wav');
    execFileSync(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error', '-i', file,
      ...FORMATS.wav.ffmpeg, wav], { stdio: ['ignore', 'pipe', 'pipe'] });
    fs.rmSync(file, { force: true });
    file = wav;
  }

  const seconds = probeSeconds(file);
  let words = attachPunctuation(wordsFromMarks(marks), text);
  const timing = words.length ? 'engine' : 'estimated';
  if (!words.length) words = estimate(text, seconds);
  const result = {
    text: String(text).replace(/\s+/g, ' ').trim(),
    voice: key, voiceId: v.id, rate: v.rate, pitch: v.pitch,
    format, file, bytes: fs.statSync(file).size, seconds,
    timing,                       /* 'engine' or 'estimated'. never guess which */
    words,
    sentences: sentencesOf(words),
    chunks: chunks.length,
  };
  /* the sidecar is the interesting half. a caption render reads this, not the
     mp3, and it is small enough to eyeball. */
  fs.writeFileSync(file.replace(/\.(mp3|wav)$/, '.json'), JSON.stringify(result, null, 2));
  return result;
}

/* ---------- cli ---------- */
const SAMPLE = 'we build the boring parts. the agent answers, the invoice files itself, '
  + 'and nobody touches a spreadsheet.';

async function cli(argv) {
  const flags = {};
  const rest = [];
  for (const a of argv) {
    const m = a.match(/^--([a-z]+)(?:=(.*))?$/);
    if (m) flags[m[1]] = m[2] === undefined ? true : m[2];
    else rest.push(a);
  }
  const cmd = rest[0] || 'test';

  if (cmd === 'voices') {
    console.log('the boring tek — the four voices we picked\n');
    for (const [k, v] of Object.entries(VOICES)) {
      console.log('  ' + k.padEnd(6) + v.id + '   rate ' + v.rate + ', pitch ' + v.pitch
        + (k === DEFAULT_VOICE ? '   [default]' : '') + (v.comedy ? '   [comedy]' : ''));
      console.log('         ' + v.note + '\n');
    }
    return;
  }

  const text = rest.slice(1).join(' ') || (cmd === 'test' ? SAMPLE : '');
  if (!text) throw new Error('nothing to say. pass a line: node lib/voice.mjs say "your copy"');

  if (cmd === 'test') {
    /* the test is one line in every voice, so the pick is made by ear against
       the same words rather than against three different ones. */
    const which = flags.voice ? [flags.voice] : Object.keys(VOICES);
    console.log('the boring tek — voice test\n  "' + text + '"\n');
    const done = [];
    for (const key of which) {
      const t0 = Date.now();
      const r = await speak(text, { voice: key, format: flags.format || 'mp3', name: 'test' });
      done.push(r);
      console.log('  ' + key.padEnd(6) + r.voiceId.padEnd(22)
        + r.seconds.toFixed(2) + 's   ' + (r.bytes / 1024).toFixed(0) + ' KB   '
        + r.words.length + ' words, timings from the ' + r.timing
        + '   ' + (Date.now() - t0) / 1000 + 's to make');
      console.log('         ' + path.relative(DEMO, r.file));
    }
    const first = done[0];
    console.log('\n  the first eight words of ' + first.voice + ', as captions.mjs will read them:');
    for (const w of first.words.slice(0, 8)) {
      console.log('    ' + w.start.toFixed(2) + '..' + w.end.toFixed(2) + '  ' + w.word);
    }
    const wps = first.words.length / first.seconds;
    console.log('\n  ' + wps.toFixed(2) + ' words a second at rate ' + first.rate
      + '. a caption card of three words therefore holds about '
      + (3 / wps).toFixed(2) + 's, which is what the pop style is cut against.');
    return;
  }

  if (cmd === 'say') {
    const r = await speak(text, {
      voice: flags.voice, format: flags.format, name: flags.name,
      rate: flags.rate, pitch: flags.pitch,
    });
    console.log(r.voice + ' — ' + r.seconds.toFixed(2) + 's, ' + r.words.length
      + ' words (' + r.timing + ') — ' + path.relative(DEMO, r.file));
    return;
  }

  throw new Error('commands are: test, say, voices');
}

/* run directly, not imported. guarded on argv[1] existing at all, because
   `node -e` and a worker both leave it undefined, and a crash there would look
   like the module itself is broken rather than the guard. */
const RUN_DIRECTLY = !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (RUN_DIRECTLY) {
  cli(process.argv.slice(2)).catch(e => {
    console.error('\n  ' + e.message);
    if (/refused the handshake/.test(e.message)) {
      console.error('\n  the two things that cause this:\n'
        + '    1. the machine clock is minutes out. the token hashes the server\'s time.\n'
        + '       one retry against its Date header already happened and also failed.\n'
        + '    2. microsoft moved the drm on. GEC_VERSION at the top of this file is a\n'
        + '       real edge build number and is the thing to bump. check what the\n'
        + '       python edge-tts package is sending today.');
    }
    process.exit(1);
  });
}
