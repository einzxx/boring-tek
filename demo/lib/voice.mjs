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
     node lib/voice.mjs voices               the five we picked, and why
     node lib/voice.mjs say "copy" --voice=mascot    the mascot's own clone
     node lib/voice.mjs say "copy" --voice=dry --format=wav --name=post6
     node lib/voice.mjs say "copy" --out=out/voice-test.mp3
     node lib/voice.mjs say "copy" --stability=0.7 --speed=0.9
     node lib/voice.mjs test --provider=edge         the old narrator, on purpose

   **since 2026-09-08 edge is the fallback, not the narrator.** elevenlabs reads
   the two narrator slots when demo/.env carries a key, through the
   `with-timestamps` endpoint so the word timings above keep arriving. the two
   slots that exist to be a *different person* — `uk`, an accent, and `aside`,
   somebody who is not the agency — stay on edge, because one cloned voice
   cannot be two people. everything below about edge is still true of edge.
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

/* ---------- demo/.env ----------
   three keys live here and none of them is ever printed: ELEVENLABS_API_KEY,
   ELEVENLABS_VOICE_ID and ELEVENLABS_VOICE_ID_MASCOT. the file is covered by
   the root `.gitignore`'s bare
   `.env` line, which matches at any depth, so demo/.env needs no rule of its
   own — `git check-ignore -v demo/.env` says so.

   read by hand rather than with dotenv. demo/ carries three devDependencies
   and a fourth is a conversation, and this is a dozen lines: KEY=value, blank
   lines and `#` comments skipped, surrounding quotes stripped if somebody
   pasted them. process.env wins over the file so a shell can override one run
   without editing anything. */
function readEnv() {
  const out = {};
  let raw;
  try { raw = fs.readFileSync(path.join(DEMO, '.env'), 'utf8'); }
  catch { return out; }
  for (const line of raw.split(/\r?\n/)) {
    if (/^\s*(#|$)/.test(line)) continue;
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (/^".*"$/.test(v) || /^'.*'$/.test(v)) v = v.slice(1, -1);
    out[m[1]] = v;
  }
  return out;
}
const ENV = readEnv();
const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY || ENV.ELEVENLABS_API_KEY || '';
/* ---------- two voice ids, one key ----------
   the narrator is the agency talking and has been the only elevenlabs voice
   since 2026-09-08. the second one is **the mascot**, and it is a second id
   rather than a second register because it is a different person: the whole
   argument `uk` and `aside` are held off elevenlabs on is that one cloned voice
   is one person, and the answer to "we want two people" is a second clone, not
   a stability number.

   a voice slot names which id it wants with `elevenId`, and a slot whose id is
   missing from demo/.env falls back to edge exactly the way a missing key
   already did. so a fresh clone with no .env still renders every clip. */
const ELEVEN_IDS = {
  narrator: process.env.ELEVENLABS_VOICE_ID || ENV.ELEVENLABS_VOICE_ID || '',
  mascot: process.env.ELEVENLABS_VOICE_ID_MASCOT || ENV.ELEVENLABS_VOICE_ID_MASCOT || '',
};

/* the key must not reach a terminal, a sidecar or a stack trace. an http error
   body can echo a header back, so every string this file prints or throws on
   the elevenlabs path goes through here first. **every id is redacted, not
   just the narrator's** — a second id added without a line here is a second id
   that leaks. */
const redact = s => {
  let t = String(s);
  if (ELEVEN_KEY) t = t.split(ELEVEN_KEY).join('<elevenlabs key>');
  for (const [k, v] of Object.entries(ELEVEN_IDS)) {
    if (v) t = t.split(v).join('<' + k + ' voice id>');
  }
  return t;
};

/* both halves or neither, per slot. a .env with a key and no voice id is a half
   filled file rather than a decision to use edge, so it says so once per slot
   and then stops: speak() is called per line and a warning per line is noise. */
const warnedHalf = new Set();
export function elevenReady(which = 'narrator') {
  const id = ELEVEN_IDS[which] || '';
  if (ELEVEN_KEY && id) return true;
  if ((ELEVEN_KEY || id) && !warnedHalf.has(which)) {
    warnedHalf.add(which);
    console.error('  demo/.env carries only half of elevenlabs\' ' + which + ' — '
      + (ELEVEN_KEY ? (which === 'mascot' ? 'ELEVENLABS_VOICE_ID_MASCOT' : 'ELEVENLABS_VOICE_ID')
        : 'ELEVENLABS_API_KEY')
      + ' is empty. reading with edge instead.');
  }
  return false;
}

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
    /* on elevenlabs this is the narrator at rest. stability mid: high enough
       that two takes of the same line match, low enough that it is not a
       reading of a list. style 0 because the brand is deadpan and style is the
       knob that adds performance. */
    eleven: { stability: 0.5, similarity: 0.8, style: 0, speakerBoost: true },
    note: 'the default. warm and unhurried. reads a statement as a '
      + 'statement rather than as an offer.',
  },
  dry: {
    id: 'en-US-EricNeural', rate: '-10%', pitch: '-4Hz',
    /* the same elevenlabs voice held flatter. this is the whole difference
       between the two narrator slots there: one voice, two registers, and
       stability is the register. */
    eleven: { stability: 0.7, similarity: 0.8, style: 0, speakerBoost: true },
    note: 'the same narrator held flatter, for a line that is a fact. on '
      + 'elevenlabs that is stability 0.7; on edge it is a second voice that '
      + 'microsoft files under rational.',
  },
  uk: {
    id: 'en-GB-RyanNeural', rate: '-6%', pitch: '0Hz',
    /* edge only, whatever the default provider is. this slot exists to be a
       different accent and we have one cloned voice, which is one accent. */
    eleven: null, whyEdge: 'it exists to be a different accent, and one voice id is one accent',
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
    /* edge only, and for the stronger version of the same reason: this is not
       the agency talking. reading it in the narrator's voice would make the one
       line in the film that belongs to somebody else sound like ours. */
    eleven: null, whyEdge: 'it is somebody who is not the agency, and the narrator cannot be them',
    note: 'female, us. the comedy voice, and the only one that is not the '
      + 'agency speaking: for a line a person in the film is thinking. light '
      + 'and warm, never played for the joke.',
  },
  /* the fifth, added 2026-09-10, and it is the only slot in the table with a
     voice id of its own. the four above are one narrator and one comedy aside;
     this one is **the mascot**, the character in the films rather than anybody
     reading over them, and post26 is the first clip where the two speak in the
     same file: the narrator reads what is typed into the chat box and this one
     reads what is in the bubble over his crown.

     it is a second clone rather than a second register, and that is the whole
     of it. `dry` is `calm` held flatter because they are one person in two
     moods; a mascot is not the narrator in a mood. `elevenId: 'mascot'` is how
     it asks for the other id, and if that id is not in demo/.env the slot falls
     back to edge like every other half configured slot.

     stability is low for the table, at 0.35: he is a character with two words
     to say and he is allowed to perform them a little, which is the one place
     in this house where "expressive" is not the wrong answer. style stays 0 —
     the brand is still deadpan and style is the knob that adds a reading of a
     line rather than a delivery of it. rate is 0% because the bubble is on
     screen for its own fixed life and a read that is a shade fast or a shade
     slow inside it is a read that does not match the picture.

     `character: true` keeps it out of `NARRATORS` for the same reason
     `comedy: true` keeps `aside` out: nothing may pick it to narrate a clip. */
  mascot: {
    id: 'en-US-AndrewMultilingualNeural', rate: '0%', pitch: '+4Hz', character: true,
    elevenId: 'mascot',
    eleven: { stability: 0.35, similarity: 0.8, style: 0, speakerBoost: true },
    note: 'the mascot, and the only slot with a voice id of its own. he is a '
      + 'character in the film rather than somebody reading over it, so he is a '
      + 'second clone rather than the narrator in a different mood.',
  },
};
export const DEFAULT_VOICE = 'calm';
/* which elevenlabs id a slot wants. everything without one is the narrator,
   which is every slot that existed before the mascot. */
export const elevenIdOf = key => (VOICES[key] && VOICES[key].elevenId) || 'narrator';
/* the narrators, which is every voice that is not marked as somebody else — the
   comedy aside and the mascot. a clip picking a read voice picks from this. */
export const NARRATORS = Object.keys(VOICES).filter(k => !VOICES[k].comedy && !VOICES[k].character);

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

/* ---------- elevenlabs ----------
   the paid narrator, and the default when demo/.env carries both halves. edge
   stays exactly where it was and takes over whenever the key is missing, so a
   fresh clone with no .env still renders every clip, just in the old voice.

   why `with-timestamps` rather than the plain endpoint. word timings are the
   whole reason this file exists: `captions.mjs` eats `{word, start, end}` and
   cuts every card against it. the plain `text-to-speech` route returns audio
   and nothing else, which would have made every elevenlabs line
   `timing: 'estimated'` — a guess, and one that would have quietly degraded
   every caption in the reel. `/with-timestamps` is the same request with a
   json envelope: base64 audio plus a character level alignment. we fold the
   characters back into words below.

   the alignment is over **the text we sent**, not over the engine's normalised
   reading of it, which is why `attachPunctuation` is not called on this path
   and does not need to be. edge hands back the spoken token — `parts.` arrives
   as `parts` — and the stops have to be walked back on afterwards. here the
   full stop is a character with its own timestamp, so it is simply still
   attached. the `normalized_alignment` field in the same response is the other
   one, and it is deliberately ignored.

   what this means for the two copy rules, because they are the reason the read
   sounds right and neither of them is enforced in code:

     - **`chat g p t`, spelled out.** post18 writes the name as four tokens so
       the synthesiser reads letters as letters. nothing here normalises,
       lowercases, strips or re-spaces the copy beyond the whitespace collapse
       `chunkText` already did, so the spelling reaches the api exactly as
       written and comes back read exactly as intended.
     - **the full stop in front of the boring tek.** post11 writes
       `go to. the boring tek, dot com`, because after a stop the synthesiser
       restarts the phrase and the name stops arriving glued to `go to the`.
       same argument: the stop is sent verbatim, and `previous_text` below is
       what keeps it working across a chunk boundary.

   `previous_text` is the one field here that is not per line style. a long
   script is split by `chunkText`, and multilingual_v2 restarts its prosody at
   every request; handing it the chunk before as context is how the second
   chunk carries on the sentence rather than opening a new one. it is text we
   already sent, so it is not billed as audio. */
const ELEVEN_URL = 'https://api.elevenlabs.io/v1/text-to-speech';
const ELEVEN_MODEL = 'eleven_multilingual_v2';
/* constant bitrate on purpose, and for the same reason edge's wire format is:
   the chunks of a long read are concatenated byte for byte, so the byte count
   has to be a duration and the file must carry no per chunk header. 128 kbps
   mp3 at 44.1k satisfies both. */
const ELEVEN_FORMAT = 'mp3_44100_128';
const ELEVEN_BPS = 128000;

/* edge's per voice `rate` is an ssml prosody percentage, and elevenlabs has no
   ssml. `speed` is the nearest thing it has, so the rates already written into
   VOICES and into ten post scripts keep meaning something instead of being
   silently dropped: -8% becomes 0.92. the api's usable band is 0.7..1.2 and
   anything outside it is clamped rather than refused.

   `pitch` has no equivalent at all and is not faked. the pitch offsets in
   VOICES apply on the edge path only, and the sidecar records which path made
   the file so a rendered line is never ambiguous about it. */
function rateToSpeed(rate) {
  const m = String(rate || '').match(/^([+-]?\d+(?:\.\d+)?)%$/);
  if (!m) return 1;
  return Math.min(1.2, Math.max(0.7, +(1 + parseFloat(m[1]) / 100).toFixed(3)));
}

/* the per line style options, which is every knob the api actually exposes.
   defaults come from the voice's own `eleven` block and any of them can be
   overridden for one line, the way `rate` and `pitch` already could:

     speak(line, { stability: 0.7 })      hold this one steadier
     speak(line, { style: 0.15 })         let this one lean
     speak(line, { speed: 0.9 })          slower than the voice's own rate

   stability is the one worth touching. low is expressive and drifts, high is
   flat and repeatable, which is what a deadpan brand wants, and it is why the
   `dry` slot sits higher than `calm` rather than on a different voice. */
function elevenStyleFor(voice, opts, rate) {
  const base = voice.eleven || {};
  const num = (a, b) => (a === undefined || a === null ? b : a);
  return {
    stability: num(opts.stability, base.stability),
    similarity: num(opts.similarity, base.similarity),
    style: num(opts.style, base.style),
    speakerBoost: num(opts.speakerBoost, base.speakerBoost),
    speed: num(opts.speed, rateToSpeed(rate)),
  };
}

/* one request. json in, json out, and the audio arrives base64 inside it
   because the timestamps have to arrive with it. */
async function elevenOnce(text, style, previous, voiceId, allowSpeed = true) {
  const settings = {
    stability: style.stability,
    similarity_boost: style.similarity,
    style: style.style,
    use_speaker_boost: style.speakerBoost,
  };
  if (allowSpeed && style.speed !== 1) settings.speed = style.speed;
  const body = { text, model_id: ELEVEN_MODEL, voice_settings: settings };
  if (previous) body.previous_text = previous;

  let res;
  try {
    res = await fetch(ELEVEN_URL + '/' + encodeURIComponent(voiceId)
      + '/with-timestamps?output_format=' + ELEVEN_FORMAT, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVEN_KEY,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new Error('elevenlabs did not answer: ' + redact(e.message));
  }

  if (!res.ok) {
    const detail = redact((await res.text().catch(() => '')).slice(0, 400));
    /* 422 is the request schema talking back. `speed` is the only field in this
       body new enough for an account's model to not know it, so it gets one
       retry without it and then the error stands. the same shape as the edge
       path's one retry against a 403. */
    if (res.status === 422 && allowSpeed && settings.speed !== undefined) {
      console.error('  elevenlabs refused voice_settings.speed — retrying without it');
      return elevenOnce(text, style, previous, voiceId, false);
    }
    const err = new Error('elevenlabs answered ' + res.status + ' ' + res.statusText
      + (detail ? ': ' + detail : ''));
    err.status = res.status;
    throw err;
  }

  let json;
  try { json = await res.json(); }
  catch (e) { throw new Error('elevenlabs sent something that is not json: ' + redact(e.message)); }
  const audio = Buffer.from(json.audio_base64 || '', 'base64');
  if (!audio.length) throw new Error('elevenlabs sent an empty audio_base64');
  return { audio, words: wordsFromAlignment(json.alignment) };
}

/* characters into words. the alignment is one entry per character of the text
   we sent, with a start and an end, so a word is a run between whitespace and
   its box runs from the first character's start to the last one's end.
   punctuation is a character like any other and stays attached, which is the
   whole advantage of this response over edge's.

   whitespace characters carry timestamps too and they are dropped on purpose:
   the space after a full stop is the breath, and a caption that holds a word
   through the breath after it reads as lag — the same reasoning `estimate()`
   already applies on the edge path. */
function wordsFromAlignment(a) {
  if (!a || !Array.isArray(a.characters)) return [];
  const chars = a.characters;
  const st = a.character_start_times_seconds || [];
  const en = a.character_end_times_seconds || [];
  const out = [];
  let word = '', start = 0, end = 0, open = false;
  const flush = () => {
    if (open && word.trim()) out.push({ word, start: +start.toFixed(3), end: +end.toFixed(3) });
    word = ''; open = false;
  };
  for (let i = 0; i < chars.length; i++) {
    if (/\s/.test(chars[i])) { flush(); continue; }
    if (!open) { open = true; word = ''; start = Number(st[i] || 0); }
    word += chars[i];
    const e = en[i] ?? st[i];
    if (e !== undefined && e !== null) end = Number(e);
  }
  flush();
  return out;
}

/* ---------- which engine reads this line ----------
   elevenlabs is the default narrator. two of the four slots stay on edge
   whatever the default is, and the reason is the same for both: **we have one
   cloned voice, and a slot that exists to be a different person cannot be it.**

     - `uk` exists to be a different accent. one voice id is one accent.
     - `aside` exists to be somebody who is not the agency — post11's typed line
       is what a person sitting in front of the form is thinking, and it reads
       as somebody else on the first syllable only because it is somebody else.

   so `voice.eleven` is null on those two and they route to edge. `calm` and
   `dry` are two registers of one narrator, which is exactly what stability and
   speed express, so they are the same elevenlabs voice read two ways.

   **`mascot` is the third answer to the same question**, and it is the right
   one: it is a different person, so it gets a different voice id. that is why
   it is on elevenlabs and the other two are not — the objection was never the
   provider, it was cloning one throat and asking it to be two people.

   an explicit `{ provider: 'elevenlabs' }` on an edge only slot falls back
   rather than throwing, so `node lib/voice.mjs test` can still walk them all. */
export const DEFAULT_PROVIDER = 'elevenlabs';
const warnedSlot = new Set();
function pickProvider(key, opts) {
  const want = opts.provider || DEFAULT_PROVIDER;
  if (want === 'edge') return 'edge';
  const voice = VOICES[key];
  if (!voice.eleven) {
    if (opts.provider && !warnedSlot.has(key)) {
      warnedSlot.add(key);
      console.error('  "' + key + '" is an edge only slot — ' + voice.whyEdge
        + '. reading it with edge.');
    }
    return 'edge';
  }
  return elevenReady(elevenIdOf(key)) ? 'eleven' : 'edge';
}

/* ---------- the one call worth knowing ----------
   speak(text) writes an mp3 into demo/out/voice/ and hands back the file, the
   duration measured off that file, and the words with their timestamps. */
export async function speak(text, opts = {}) {
  const key = opts.voice || DEFAULT_VOICE;
  const voice = VOICES[key];
  if (!voice) throw new Error('no voice called "' + key + '". we ship ' + Object.keys(VOICES).join(', '));
  const format = opts.format || 'mp3';
  if (!FORMATS[format]) throw new Error('format is mp3 or wav, not "' + format + '"');
  /* per call overrides, so a clip can slow one line down without a new voice.
     rate and pitch are edge's; on the elevenlabs path rate becomes `speed` and
     pitch is dropped, which `elevenStyleFor` says out loud. */
  const v = { id: voice.id, rate: opts.rate || voice.rate, pitch: opts.pitch || voice.pitch };
  const provider = pickProvider(key, opts);

  const chunks = chunkText(text);
  const audio = [];
  let words = [];
  let carried = 0;                       /* seconds of audio already written */

  const elevenId = ELEVEN_IDS[elevenIdOf(key)];
  if (provider === 'eleven') {
    const style = elevenStyleFor(voice, opts, v.rate);
    let previous = '';
    for (const chunk of chunks) {
      const got = await elevenOnce(chunk, style, previous, elevenId);
      /* the alignment restarts at zero every request, so a chunk after the
         first is pushed along by the audio the chunks before it really
         produced. constant bitrate, so that is exact arithmetic on the byte
         count and needs no probe — the same trick the edge path uses.

         the trap, measured rather than assumed. every response opens with a
         xing header frame, so a chunk's byte duration is one frame longer than
         what ffmpeg reports for it: 51453 bytes is 3.2158s of bytes and ffmpeg
         says 3.19s, and the gap is 1152/44100 = 0.0261s to three places. the
         **byte** figure is the right one to carry anyway, because mid file that
         header is no longer at offset zero, so no decoder recognises it and it
         plays as 26ms of silence in front of the chunk it belongs to. carrying
         the probed duration instead would pull every chunk after the first
         26ms early, and it would compound. */
      for (const w of got.words) {
        words.push(carried
          ? { word: w.word, start: +(w.start + carried).toFixed(3), end: +(w.end + carried).toFixed(3) }
          : w);
      }
      audio.push(got.audio);
      carried += got.audio.length * 8 / ELEVEN_BPS;
      previous = chunk;
    }
    /* no attachPunctuation here on purpose: the alignment is over the text we
       sent, so the stops never came off in the first place. */
  } else {
    const marks = [];
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
    words = attachPunctuation(wordsFromMarks(marks), text);
  }

  const buf = Buffer.concat(audio);
  if (!buf.length) throw new Error('the endpoint sent no audio at all');
  /* `out` writes to an exact path — for a one off listen, or a clip that wants
     the file somewhere of its own. everything else lands in demo/out/voice/
     under a slug, which is what every post script relies on. */
  const target = opts.out ? path.resolve(DEMO, opts.out) : null;
  const dir = target ? path.dirname(target) : VOICE_OUT;
  fs.mkdirSync(dir, { recursive: true });
  const name = target
    ? path.basename(target).replace(/\.(mp3|wav)$/i, '')
    : (opts.name ? slug(opts.name) : slug(text)) + '-' + key;
  let file = path.join(dir, name + '.mp3');
  fs.writeFileSync(file, buf);
  if (format === 'wav') {
    const wav = path.join(dir, name + '.wav');
    execFileSync(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error', '-i', file,
      ...FORMATS.wav.ffmpeg, wav], { stdio: ['ignore', 'pipe', 'pipe'] });
    fs.rmSync(file, { force: true });
    file = wav;
  }

  const seconds = probeSeconds(file);
  const timing = words.length ? 'engine' : 'estimated';
  if (!words.length) words = estimate(text, seconds);
  const result = {
    text: String(text).replace(/\s+/g, ' ').trim(),
    voice: key, voiceId: provider === 'eleven' ? elevenId : v.id,
    /* which of the two clones read it, by name rather than by id. the id is a
       secret and the sidecar is written into demo/out/, so the name is the only
       half of that fact a later session may look at. */
    elevenId: provider === 'eleven' ? elevenIdOf(key) : null,
    /* which engine read it, and under what. a line rendered before the .env
       existed and a line rendered after it are different takes, and the sidecar
       is the only place that says which one a file is. */
    provider: provider === 'eleven' ? 'elevenlabs' : 'edge',
    model: provider === 'eleven' ? ELEVEN_MODEL : null,
    rate: v.rate, pitch: provider === 'eleven' ? null : v.pitch,
    speed: provider === 'eleven' ? elevenStyleFor(voice, opts, v.rate).speed : null,
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
    const live = elevenReady('narrator');
    console.log('the boring tek — the ' + Object.keys(VOICES).length + ' voices we picked\n');
    console.log('  narrator: ' + (live ? 'elevenlabs, ' + ELEVEN_MODEL
      : 'edge — demo/.env has no elevenlabs key, so edge is reading everything'));
    console.log('  mascot:   ' + (elevenReady('mascot') ? 'elevenlabs, its own voice id'
      : 'edge — demo/.env has no ELEVENLABS_VOICE_ID_MASCOT') + '\n');
    for (const [k, v] of Object.entries(VOICES)) {
      const engine = v.eleven && elevenReady(elevenIdOf(k)) ? 'elevenlabs' : 'edge';
      console.log('  ' + k.padEnd(7) + engine.padEnd(12)
        + (engine === 'edge' ? v.id + '   rate ' + v.rate + ', pitch ' + v.pitch
          : 'stability ' + v.eleven.stability + ', speed ' + rateToSpeed(v.rate))
        + (k === DEFAULT_VOICE ? '   [default]' : '') + (v.comedy ? '   [comedy]' : '')
        + (v.character ? '   [character]' : ''));
      console.log('         ' + v.note);
      if (!v.eleven) console.log('         edge only: ' + v.whyEdge + '.');
      console.log('');
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
      const r = await speak(text, {
        voice: key, format: flags.format || 'mp3', name: 'test',
        provider: flags.provider,
      });
      done.push(r);
      /* the engine, not the voice id: on the elevenlabs path the id is an
         account resource and there is no reason for it to be on a terminal. */
      console.log('  ' + key.padEnd(6) + r.provider.padEnd(12)
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
    /* the style flags are numbers to the api and strings on a command line. */
    const num = f => (flags[f] === undefined ? undefined : parseFloat(flags[f]));
    const r = await speak(text, {
      voice: flags.voice, format: flags.format, name: flags.name,
      rate: flags.rate, pitch: flags.pitch,
      provider: flags.provider, out: flags.out,
      stability: num('stability'), style: num('style'), speed: num('speed'),
    });
    console.log(r.voice + ' on ' + r.provider + ' — ' + r.seconds.toFixed(2) + 's, '
      + r.words.length + ' words (' + r.timing + ') — ' + path.relative(DEMO, r.file));
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
    if (/^elevenlabs answered 401/.test(e.message)) {
      console.error('\n  the key in demo/.env is not being accepted. check it is the whole\n'
        + '  key, unquoted, on the ELEVENLABS_API_KEY line. --provider=edge reads the\n'
        + '  line with the old narrator in the meantime.');
    }
    if (/^elevenlabs answered 404/.test(e.message)) {
      console.error('\n  the voice id in demo/.env is not one this account can see. it is the\n'
        + '  id on the voice\'s own page, not its name.');
    }
    if (/^elevenlabs answered 429/.test(e.message)) {
      console.error('\n  out of credits, or too many at once. this file sends one request per\n'
        + '  chunk in series, so 429 here means the account, not the loop.');
    }
    process.exit(1);
  });
}
