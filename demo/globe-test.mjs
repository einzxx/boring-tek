/* the boring tek — the globe test. three seconds of the earth turning, and
   nothing else in the frame.

     node globe-test.mjs still            one frame to out/globe-still.png
     node globe-test.mjs                  3s at 12fps, dark, to out/
     node globe-test.mjs --spin=90        a different starting longitude
     node globe-test.mjs still --tilt=0   straight on, no lean

   there are exactly two outputs and they are always the same two paths,
   overwritten every run, which is rig-test.mjs's rule and rig-test.mjs's
   reason: the name says what it is, the file's own timestamp says when it was
   made, and a stale clip cannot survive a render because the render lands on
   top of it.

     demo/out/globe-still.png
     demo/out/globe-test-dark-1080x1920.mp4

   ---------- the data ----------
   natural earth 110m land, the public domain one, downloaded once into
   demo/assets/ and gitignored there by the existing `demo/assets/*` rule.
   127 features, 128 rings, 5143 points. it is coarse on purpose: at a globe
   340 css px across, a finer set would spend its detail below one device
   pixel and cost the render time anyway.

   ---------- why the projection runs backwards ----------
   this is an orthographic projection of real coordinates, which is what
   d3.geoOrthographic is, but it is evaluated **per screen pixel rather than
   per polygon vertex**, and that is a deliberate choice rather than a shortcut
   around not having d3.

   the forward way — project every vertex, drop the ones on the far side, draw
   the rings — has one hard part, and it is not the projection. it is the
   clipping. a ring that crosses the limb has to be cut at the horizon and then
   **closed along the horizon arc**, in the winding direction the ring was
   going, or the fill leaks. d3 has `clipCircle` for exactly this and it is the
   fiddliest code in the library. the case that breaks a hand rolled version is
   already in this file's data: antarctica is a single ring spanning the whole
   -180..180 and touching -90, so it wraps the globe and contains a pole, and
   the shorter-arc heuristic everyone reaches for first closes it the wrong way
   round and floods the southern hemisphere white.

   running the projection backwards has no clipping in it at all. for each
   pixel inside the disc, invert to a latitude and a longitude, look that point
   up in a land mask, and paint. there is no ring to cut, no arc to close, no
   winding to preserve, and antarctica is just a lot of pixels that answer yes.
   the projection is the same projection: the same sphere, the same orthographic
   relation, solved for the other unknown.

   it is also cheaper here than it sounds, because of one property of a globe
   that only spins. the inverse of a screen pixel is a latitude and a longitude
   **measured from whatever is facing the camera**, and spinning the globe does
   not move the pixel, it only changes which longitude is facing the camera. so
   the latitude and the view relative longitude of every pixel are computed
   once, into two typed arrays, and a frame is then one subtraction and one
   texture lookup per sample. thirty six frames cost barely more than one.

   ---------- what is on the screen ----------
   white land, black ocean, and the shading that makes it a ball rather than a
   disc:

     the limb. a horizontal falloff, dark at the left and right edges, because
     that is the read that says sphere. it multiplies the land as well as the
     ocean, so a continent rotating toward the edge dims as it goes rather than
     staying flat white until it disappears. there is a much smaller radial term
     under it, and it is there for one reason: a purely horizontal falloff
     leaves the top and bottom of the disc at full brightness, which reads as a
     cylinder seen end on. LIMB.radial is the smallest number that kills that.

     the glow. `lib/mascot.mjs`'s face glow, the same two layers at the same
     numbers — 11px of blur at .20 and 30px at .13, dark theme only, because a
     glow on white is a smudge. on the face those layers are blurred copies of
     the plate, which is the white silhouette of the thing. **so they are
     blurred copies of the disc here, in white, not copies of the globe.** a
     blurred copy of the globe would be a halo the colour of the ocean, which is
     no halo at all, and the sphere would have no edge on a near black page. the
     glow is what draws the limb; there is no ring stroked around it.

     the pings. a new one every 0.3 to 0.5s at a real point on the sphere,
     growing from a dot to 40 device px over 0.8s and fading as it goes, with a
     tiny lowercase `ai` held still at the middle of it. a ping is a latitude
     and a longitude, so it turns with the globe and it goes behind the edge
     rather than sliding off it. **it is only ever born on a black pixel**, and
     that is tested against the rendered frame rather than against the land
     mask — see PING.maxLum for why the rule is a colour and not a continent.

   ---------- it is silent and it is one layer ----------
   no camera, no mascot, no transitions, no voice, no sound. the question this
   clip answers is whether the globe reads as a real turning earth, and anything
   else in the frame would be the thing being judged instead.
*/

import puppeteer from 'puppeteer-core';
import ffmpeg from 'ffmpeg-static';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { STAGE, GLOW, SAFE } from './lib/mascot.mjs';
import { globeCss, globeMarkup, globeScript, GLOBE_FONT, readLand, LAND_FILE } from './lib/globe.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'out');
const FRAMES = path.join(OUT, 'frames-globe');
const LAND = LAND_FILE;

const VW = STAGE.w, VH = STAGE.h, DSF = STAGE.dsf;

const argv = process.argv.slice(2);
const flag = (name, d) => {
  const hit = argv.find(a => a.startsWith('--' + name + '='));
  return hit === undefined ? d : parseFloat(hit.split('=')[1]);
};
const STILL = argv.includes('still');
const KEEP = argv.includes('--keep-frames');

const FPS = Number(process.env.DEMO_FPS || 12);
const SECONDS = 3.0;
const THEME = 'dark';

/* ---------- the globe ----------
   340 css px across the middle of a 540 wide stage. the safe area is 140 device
   px each side, which is 70 css, leaving 400 css of usable width, so 340 sits
   inside it with 30 css px to spare on each side before the glow is counted. */
const GLOBE = {
  d: 340,                       /* css px across */
  cx: VW / 2,
  cy: VH / 2,
};

/* the lean. a globe rendered dead on with no tilt puts the equator across the
   middle as a straight line and reads as a spinning disc; a few degrees of
   north pole showing is what says ball. it is small on purpose — this is the
   earth seen from a long way off, not a desk globe on its stand. */
const TILT = flag('tilt', 14);
const SPIN0 = flag('spin', 20);       /* the longitude facing us at t=0 */
const TURN_RATE = flag('rate', 24);   /* degrees a second. slow, as asked. */

/* the shading. `amount` is how dark the left and right edges go, `power` is how
   fast it gets there, and `radial` is the small term that stops the top and
   bottom of the disc reading as the flat ends of a cylinder. */
const LIMB = {
  amount: flag('limb', 0.72),
  power: flag('limb-power', 3.2),
  radial: flag('limb-radial', 0.22),
};

/* the two inks. the ocean is black rather than the page's own near black, so
   the sphere is a darker object sitting on the page instead of a hole cut in
   it, and the glow behind it does the separating.

   **land is the white one.** this is worth writing down because the picture is
   a genuine figure/ground illusion and it has now fooled two readings of the
   same frame: with the atlantic basin facing the camera, the ocean is a
   continuous dark shape ringed by land and the eye happily takes the land for
   the background. it is not a matter of opinion and it is not judged by eye —
   `stats().probes` checks six named places on every run, and the pacific
   hemisphere at --spin=160 comes back overwhelmingly black, which is the answer
   for water and could not be the answer for land. */
const INK = { land: '255,255,255', ocean: '0,0,0' };

/* ---------- the graticule ----------
   fifteen degrees apart, turning with the globe because the meridians are fixed
   to longitude and longitude is what the spin moves.

   **it is drawn in screen space, not in degrees**, and that is the whole trick.
   a line a fixed number of degrees wide is a line whose screen width collapses
   toward the limb, where the projection crushes a degree of longitude into
   almost no pixels at all; drawn that way the meridians converge into a solid
   grey smear at both edges and the globe grows a cage exactly where it should
   be getting quieter. so the distance to the nearest line is measured in
   degrees, divided by how many degrees a pixel is worth at that point, and the
   line is one constant width on the screen wherever it lands.

   the same number tells the grid when to stop. once the meridians are closer
   together than `fadeHi` pixels there is no honest way to draw them, so they
   fade out over that range instead of aliasing into moire. the grid therefore
   thins away toward the limb and toward the poles on its own, which is also the
   thing that keeps it reading as data rather than as a cage.

   it is masked to the white areas. light grey on white is a faint line; the
   same grey over the black ocean would be a wireframe over the water, which is
   a different picture from the one that was asked for. */
const GRID = {
  on: !argv.includes('--no-grid'),
  step: flag('grid', 15),              /* degrees */
  width: flag('grid-width', 1.3),      /* device px, so ~0.65 css px */
  o: flag('grid-opacity', 0.35),
  ink: [120, 120, 120],
  /* gone by 2.5 device px of spacing, full by 6. */
  fadeLo: 2.5, fadeHi: 6,
};

/* ---------- the pings ----------
   a new one every 0.3 to 0.5 seconds at a real place on earth, growing from a
   dot to 40 device px across over 0.8s and fading as it goes, with a tiny
   lowercase `ai` at the middle of it.

   **a ping is a latitude and a longitude, not a position on the screen.** it is
   projected every frame by the same forward orthographic the pixels are
   inverted through, so it turns with the globe, and it is simply not drawn on
   the frames where its own point is on the far side. that is what makes it go
   behind the edge rather than slide off it.

   the schedule is built once from a fixed seed, so the clip is identical on
   every run and a frame is still a pure function of time — the rig's rule. the
   generator is the same lcg `lib/mascot.mjs` seeds its idle from.

   **spawn points are area correct.** latitude is drawn as asin(2u-1) rather
   than uniformly, because a degree of longitude is worth almost nothing near
   the poles and uniform latitude piles every ping into the arctic. and a
   candidate is rejected unless the mask reads above 0.9, so a ping starts
   inside a landmass rather than on a coastline pixel where half of it would sit
   in the sea.

   `max` is a ceiling rather than a target: 0.8s of life against a 0.3 to 0.5s
   gap is two or three alive at once, and five is the number at which the frame
   would start to look busy. */
const PING = {
  on: !argv.includes('--no-pings'),
  every: [0.3, 0.5],                    /* seconds between spawns */
  life: flag('ping-life', 0.8),
  size: flag('ping-size', 40),          /* device px across at full growth */
  width: flag('ping-width', 1.5),       /* device px of stroke */
  max: 5,
  /* how far onto the near side a ping has to start. 0.35 is about 70 degrees
     from the point facing the camera, which keeps every ping on the face of the
     sphere rather than on the rim. it was 0.18 for one render and the review
     caught it: four consecutive samples from 1.75s put a ping at the left limb,
     two of them clipped by the edge of the disc. a ping can still leave — the
     globe turns 19 degrees in a ping's life — it just cannot be born there. */
  minZ: 0.35,
  seed: 20260908,
  label: 'ai',
  font: { family: 'Manrope', weight: 700, size: 12 },   /* size in device px */

  ink: '255,255,255',

  /* ---------- where a ping is allowed to be born ----------
     **the rule is the rendered colour under the point, and nothing else.**
     black is allowed, white is not. there is no land test and no ocean test
     here any more, and that is the point of writing it this way: those two
     words describe the data, the eye only ever sees the picture, and the two
     had already been argued about three times before this rule replaced them.

     so the check is made against the frame the ping is actually born on.
     `spawnPoint` draws the globe at that moment first, then reads the pixel out
     of `imgSharp.data` — the same buffer that is about to be put on the canvas
     and screenshotted. a mask lookup would be a second opinion about what the
     picture contains; this is the picture.

     reading the frame rather than the mask also picks up two things a mask
     cannot. the limb shading is in it, so a point is judged at the brightness
     it will really have. and the antialiased coastline is in it, so a candidate
     half a pixel into a coast reads as grey and is refused rather than
     rounded one way by a threshold on a mask.

     `maxLum` is strict on purpose. the ocean renders as an exact 0 — black ink
     multiplied by any shade is still black — so anything above a handful of
     levels is either land, a graticule line or a coastline edge, and none of
     the three is somewhere a white ring belongs. */
  maxLum: 12,
  /* and the four neighbours at this radius have to be dark too, so a ping is
     never born straddling a coastline. the point alone is the letter of the
     rule; this is the half pixel of margin that keeps it true at the edges. */
  clear: 3,
};

/* the land mask. 2048 x 1024 equirectangular, which is 5.69 px a degree
   against the data's own ~0.1 degree precision and against roughly 4 px a
   degree on the screen at the middle of the disc. finer would be sampling
   detail the source does not have. */
const MASK = { w: 2048, h: 1024 };

/* 2x2 samples a pixel. the coastline is the whole picture here and a hard
   thresholded edge on a white-on-black shape is the one artefact that would
   read as a rendering fault rather than as a map. */
const SS = 2;

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(p => { try { return fs.existsSync(p); } catch { return false; } });

/* ---------- the page ----------
   the globe itself is `lib/globe.mjs` now, because post24 wanted the same one
   in a film and two copies of a sphere is two spheres. what is left here is the
   harness around it: a stage, the theme, and the one animation chrome needs to
   keep producing frames. */
function pageHtml(geojson) {
  return `<!doctype html>
<html lang="en" data-theme="${THEME}">
<head>
<meta charset="utf-8">
<title>globe</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${GLOBE_FONT(PING.font.weight)}">
<style>
:root{ --bg:#ffffff; }
[data-theme=dark]{ --bg:#06070a; }
*{box-sizing:border-box}
html,body{margin:0;padding:0;overflow:hidden;background:var(--bg)}
body{width:${VW}px;height:${VH}px}
.stage{position:relative;width:${VW}px;height:${VH}px;overflow:hidden;background:var(--bg)}
/* load bearing, not decoration: with nothing animating at all chrome stops
   producing compositor frames and the screenshot call blocks on frame one
   forever. post2.mjs found this and every clip in demo/ has carried something
   like it since. */
.tick{position:absolute;left:-20px;top:-20px;width:2px;height:2px;background:var(--bg);
  will-change:transform;animation:tick 34s cubic-bezier(.45,0,.55,1) infinite alternate}
@keyframes tick{from{transform:translate3d(0,0,0)}to{transform:translate3d(1px,0,0)}}
${globeCss(GLOBE_OPTS)}
</style>
</head>
<body>
<div class="stage">
  <div class="tick"></div>
  ${globeMarkup(geojson)}
</div>
<script>
${globeScript(GLOBE_OPTS)}
<\/script>
</body>
</html>`;
}

/* every flag this harness carries, folded into the shape lib/globe.mjs takes.
   the module holds the defaults; this holds the knobs. */
const GLOBE_OPTS = {
  d: GLOBE.d, cx: GLOBE.cx, cy: GLOBE.cy, dsf: DSF, ss: SS, mask: MASK,
  tilt: TILT, spin0: SPIN0, rate: TURN_RATE, seconds: SECONDS,
  limb: LIMB, ink: INK, grid: GRID, ping: PING,
};

function serve(html) {
  const srv = http.createServer((req, res) => {
    const p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/' || p === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(html);
    }
    res.writeHead(404); res.end('not here');
  });
  return new Promise(r => srv.listen(0, '127.0.0.1', () => r({ srv, port: srv.address().port })));
}

/* the longitude facing the camera at time t. one direction, one speed, no ease:
   the earth does not accelerate. */
const spinAt = t => SPIN0 + TURN_RATE * t;

async function open() {
  if (!CHROME) throw new Error('no chrome found — add its path to CHROME at the top of this file');
  const geojson = readLand();
  const { srv, port } = await serve(pageHtml(geojson));
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--hide-scrollbars', '--disable-lcd-text', '--font-render-hinting=none',
      '--force-color-profile=srgb', '--disable-dev-shm-usage', '--mute-audio'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: VW, height: VH, deviceScaleFactor: DSF });
  const cdp = await page.createCDPSession();
  await cdp.send('Emulation.setEmulatedMedia', {
    features: [
      { name: 'prefers-reduced-motion', value: 'no-preference' },
      { name: 'prefers-color-scheme', value: THEME },
    ],
  });

  let expired = null;
  cdp.on('Emulation.virtualTimeBudgetExpired', () => { const f = expired; expired = null; if (f) f(); });
  const advance = async ms => {
    const p = new Promise(r => { expired = r; });
    await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pauseIfNetworkFetchesPending', budget: ms });
    await p;
  };

  await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pause' });
  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:' + port + '/' });
  for (let i = 0; i < 400; i++) {
    const ok = await page.evaluate(() => !!(window.__globe && window.__globe.ready)
      && document.fonts.status === 'loaded').catch(() => false);
    if (ok) break;
    await advance(1000 / 60);
  }
  const ok = await page.evaluate(() => !!(window.__globe && window.__globe.ready));
  if (!ok) throw new Error('the globe layer never became ready');

  const stats = await page.evaluate(() => window.__globe.stats());
  console.log('  built: ' + stats.disc + 'px disc, ' + stats.samples + ' subsamples inside it, '
    + stats.features + ' land features, ' + stats.maskLandPct + '% of the mask is land');
  /* the mask, checked against six places rather than against a picture. land
     must read 1 and open ocean must read 0, and a globe with the two swapped is
     still a perfectly convincing looking globe, which is exactly why this is
     printed on every run. */
  for (const [where, v] of Object.entries(stats.probes)) {
    const want = /atlantic|pacific|indian/.test(where) ? 0 : 1;
    console.log('    ' + (v === want ? 'ok  ' : 'BAD ') + where.padEnd(22) + v);
  }

  const shoot = async file => {
    const shot = await cdp.send('Page.captureScreenshot', {
      format: 'png', captureBeyondViewport: false,
      clip: { x: 0, y: 0, width: VW, height: VH, scale: DSF },
    });
    fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
  };

  return { browser, srv, page, shoot, stats };
}

function ff(args) { return execFileSync(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString(); }

function probe(file) {
  let out = '';
  try { execFileSync(ffmpeg, ['-hide_banner', '-i', file], { stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { out = (e.stderr || '').toString(); }
  const dur = out.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
  const res = out.match(/,\s*(\d{2,5})x(\d{2,5})[\s,]/);
  const fps = out.match(/([\d.]+)\s*fps/);
  return {
    seconds: dur ? +dur[1] * 3600 + +dur[2] * 60 + parseFloat(dur[3]) : null,
    w: res ? +res[1] : null, h: res ? +res[2] : null,
    fps: fps ? parseFloat(fps[1]) : null,
  };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  if (!fs.existsSync(LAND)) {
    throw new Error('no land data at demo/assets/ne_110m_land.geojson.\n'
      + '  fetch it once:\n'
      + '    curl -L -o demo/assets/ne_110m_land.geojson \\\n'
      + '      https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson');
  }

  if (STILL) {
    console.log('the boring tek — globe, one frame\n');
    const { browser, srv, page, shoot } = await open();
    /* --at picks the moment. the still defaults to t=0, which is before the
       first ping, so a frame with pings on it needs a time asking for. */
    const at = flag('at', 0);
    const shown = await page.evaluate((t, s) => window.__globe.apply(t, s), at, spinAt(at));
    const file = path.join(OUT, 'globe-still.png');
    await shoot(file);
    await browser.close(); srv.close();
    console.log('  tilt ' + TILT + ' degrees, longitude ' + spinAt(0).toFixed(1) + ' facing us');
    console.log('  ' + path.relative(HERE, file) + '  '
      + (fs.statSync(file).size / 1024).toFixed(0) + ' KB, ' + VW * DSF + 'x' + VH * DSF);
    return;
  }

  console.log('the boring tek — globe test, ' + SECONDS + 's at ' + FPS + 'fps\n');
  fs.rmSync(FRAMES, { recursive: true, force: true });
  fs.mkdirSync(FRAMES, { recursive: true });

  const { browser, srv, page, shoot } = await open();
  const pings = await page.evaluate(() => window.__globe.pings);
  const schedule = await page.evaluate(() => window.__globe.schedule);
  const N = Math.round(FPS * SECONDS);
  const wall = Date.now();
  /* the pings are reported off the render rather than off the schedule: the
     schedule says when one starts, and only the frames know how many were
     actually on the near side of the globe when it did. */
  let mostAlive = 0, pingFrames = 0;
  for (let f = 0; f < N; f++) {
    const t = f / FPS;
    const shown = await page.evaluate((tt, s) => window.__globe.apply(tt, s), t, spinAt(t));
    if (shown > mostAlive) mostAlive = shown;
    pingFrames += shown > 0 ? 1 : 0;
    await shoot(path.join(FRAMES, 'f' + String(f).padStart(5, '0') + '.png'));
  }
  /* read out of the page before it is closed, not after. */
  const seen = await page.evaluate(() => window.__globe.seen());
  await browser.close(); srv.close();
  console.log('  ' + N + ' frames in ' + ((Date.now() - wall) / 1000).toFixed(1) + 's');

  const out = path.join(OUT, 'globe-test-' + THEME + '-' + VW * DSF + 'x' + VH * DSF + '.mp4');
  /* png frames rather than jpeg. the picture is a soft white glow falling off
     into near black over a long ramp, which is the one thing jpeg bands. */
  ff(['-y', '-hide_banner', '-loglevel', 'error',
    '-framerate', String(FPS), '-i', path.join(FRAMES, 'f%05d.png'),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p',
    '-r', String(FPS), '-movflags', '+faststart', out]);
  if (!KEEP) fs.rmSync(FRAMES, { recursive: true, force: true });

  /* the sidecar, beside the clip and gitignored with it. it is what makes the
     colour rule checkable after the fact rather than only trustable. */
  fs.writeFileSync(path.join(OUT, 'globe-pings.json'), JSON.stringify({
    tilt: TILT, spin0: SPIN0, rate: TURN_RATE,
    disc: { cx: VW * DSF / 2, cy: VH * DSF / 2, r: GLOBE.d * DSF / 2 },
    maxLum: PING.maxLum, minZ: PING.minZ, life: PING.life,
    pings: schedule,
  }, null, 2));

  const p = probe(out);
  console.log('  ' + path.relative(HERE, out));
  console.log('  ' + p.w + 'x' + p.h + ', ' + p.seconds + 's, ' + p.fps + 'fps, '
    + (fs.statSync(out).size / 1024).toFixed(0) + ' KB');
  const turned = TURN_RATE * SECONDS;
  console.log('  ' + seen + ' pings on screen of ' + pings + ' scheduled (the rest fall '
    + 'past the end of the clip), at most ' + mostAlive + ' at once, on '
    + pingFrames + ' of ' + N + ' frames');
  console.log('  every one born on a pixel the frame itself renders at or under '
    + 'luminance ' + PING.maxLum + ', measured on the frame and not on the mask');
  console.log('  it turns ' + turned.toFixed(0) + ' degrees over the clip, '
    + TURN_RATE + ' a second, one direction, no ease');
}

main().catch(e => { console.error('\n  ' + e.message); process.exit(1); });
