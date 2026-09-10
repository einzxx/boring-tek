/* the boring tek — the globe. natural earth land on an orthographic sphere,
   drawn per pixel, with a graticule and the ping rings over it.

   this was globe-test.mjs's whole page until post24 wanted the same globe in a
   film. it is here rather than there for the reason every other file in this
   folder is here: two callers. `globe-test.mjs` is now a harness that renders
   it on its own, and a post script drops the same three pieces into its own
   page. neither one owns it and neither one has a second copy of it.

   the three pieces are the shape every module in demo/lib/ hands back:

     globeCss(o)      the zone, the canvases and the two glow layers
     globeMarkup(o)   the four canvases and the land data, as one block
     globeScript(o)   the reader, the projection and the pings, as an iife

   and the page is expected to provide `window.__globe.apply(t, spin)`'s two
   numbers itself: the clip's clock and where the globe has turned to. nothing
   in here has an opinion about time.

   everything that was argued about in globe-test.mjs is still argued about
   there, in that file's header — why the projection runs backwards, why the
   glow is a copy of the disc rather than of the globe, why the graticule is
   drawn in screen space, and why a ping is born on a black pixel. this file is
   the code those notes are about; it did not move an inch when it moved here.
*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GLOW } from './mascot.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEMO = path.resolve(HERE, '..');
export const LAND_FILE = path.join(DEMO, 'assets', 'ne_110m_land.geojson');

/* natural earth 110m land, public domain, downloaded once and gitignored by the
   existing `demo/assets/*` rule. it is not in the repo, so a clean clone is
   told what to fetch rather than left with a stack trace. */
export function readLand() {
  if (!fs.existsSync(LAND_FILE)) {
    throw new Error('no land data at demo/assets/ne_110m_land.geojson.\n'
      + '  fetch it once:\n'
      + '    curl -L -o demo/assets/ne_110m_land.geojson \\\n'
      + '      https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson');
  }
  return fs.readFileSync(LAND_FILE, 'utf8');
}

/* every number the globe has, in one place, and every one of them overridable
   per caller. the notes on each are in globe-test.mjs's header. */
export const GLOBE_DEFAULTS = {
  d: 340,                       /* css px across */
  cx: 270, cy: 480,             /* css px, the middle of the stage */
  dsf: 2,
  ss: 2,                        /* subsamples a pixel, each way */
  mask: { w: 2048, h: 1024 },
  tilt: 14,
  spin0: 20,
  rate: 24,                     /* degrees a second */
  seconds: 3,
  limb: { amount: 0.72, power: 3.2, radial: 0.22 },
  ink: { land: '255,255,255', ocean: '0,0,0' },
  grid: {
    on: true, step: 15, width: 1.3, o: 0.35,
    ink: [120, 120, 120], fadeLo: 2.5, fadeHi: 6,
  },
  ping: {
    on: true, every: [0.3, 0.5], life: 0.8, size: 40, width: 1.5,
    max: 5, minZ: 0.35, seed: 20260908, label: 'ai',
    font: { family: 'Manrope', weight: 700, size: 12 },
    ink: '255,255,255', maxLum: 12, clear: 3,
    /* ---------- where a ping is allowed to be born, as a window ----------
       the rule has always been the **rendered colour under the point**, and on
       the globe this file was written for the ground is white and the sea is
       black, so "dark" and "the sea" were the same sentence and one ceiling
       said both.

       invert the ink — dark continents on a light ball — and they come apart:
       the ground is still the dark half but it is no longer black, and the
       ceiling that meant "sea" now means "land". so the test is a band rather
       than a maximum, and a caller that wants the white half asks for the top
       of the range instead of the bottom.

       `null` is the default and it reads `[0, maxLum]`, which is the ceiling
       this file always had, so nothing that does not ask for a window can tell
       this exists. */
    lum: null,
    /* ---------- and the geometry, as a second opinion ----------
       the colour rule reads the picture, which is its whole strength: it cannot
       disagree with what ships. it is also the only test, and a picture can be
       right about a colour and wrong about a place — an antialiased coastline,
       a lake drawn in the land's own ink, a limb angle that pulls a shallow sea
       into the window.

       with this on, a candidate is also tested **against the land polygons
       themselves**, by ray casting in lon/lat against the same geojson the mask
       is built from, under the same even-odd rule the mask is filled with, so a
       hole in the data is a hole in both. the two tests share no code and no
       intermediate: one reads a rendered byte and the other reads a coordinate.
       a point has to pass both.

       off by default, so a caller that does not ask for it renders exactly what
       it always did. */
    inLand: false,
  },
  /* ---------- the mirror ball, off unless a caller asks ----------
     the same sphere with the land swapped for tiles. it is here rather than in
     a second file for the reason the globe itself is here: a disco ball is an
     orthographic sphere with a limb on it and a coverage-antialiased rim, and
     that is every line above this one. what changes is one branch in the
     subsample loop — the land mask and the graticule become a row/column
     lookup and a grout line — and nothing else in the file moves.

     `on: false` is the promise. with it off the draw loop takes the branch it
     always took, so an existing caller renders the same pixels it rendered
     before; the only difference is a few unread constants in the emitted
     script.

     the rows are bands of latitude and the columns are counted per row off
     cos(lat), which is what keeps a tile square all the way to the pole and is
     why a real ball's top rows are wide. the grout is the graticule's own band
     maths at this row's own two steps, so it is TILES.gap across on the screen
     wherever it falls and fades out where the tiles get too dense to draw —
     which is the limb, and a blurred edge is what a mirror ball's limb does. */
  tiles: {
    on: false,
    rows: 22,                   /* bands of latitude, pole to pole */
    gap: 1.4,                   /* device px of grout between two tiles */
    curve: 1.6,                 /* how the random runs from base to top */
    base: [138, 142, 148],      /* the dullest mirror */
    top: [242, 244, 247],       /* the brightest ordinary one */
    hot: 0.07,                  /* the share that catch the light outright */
    hotInk: [255, 255, 255],
    grout: [9, 10, 13],
    fadeLo: 2.5, fadeHi: 6,
    seed: 20260910,
  },
};

const merge = (o = {}) => ({
  ...GLOBE_DEFAULTS, ...o,
  limb: { ...GLOBE_DEFAULTS.limb, ...(o.limb || {}) },
  ink: { ...GLOBE_DEFAULTS.ink, ...(o.ink || {}) },
  grid: { ...GLOBE_DEFAULTS.grid, ...(o.grid || {}) },
  ping: { ...GLOBE_DEFAULTS.ping, ...(o.ping || {}), font: { ...GLOBE_DEFAULTS.ping.font, ...((o.ping || {}).font || {}) } },
  tiles: { ...GLOBE_DEFAULTS.tiles, ...(o.tiles || {}) },
});

/* the one external request the globe needs, and it is the house's own: Manrope,
   for the two letters inside a ping. a page that already asks for Manrope should
   not add this a second time. */
export const GLOBE_FONT = weight => 'https://fonts.googleapis.com/css2?family=Manrope:wght@'
  + weight + '&display=swap';

/* the zone is positioned by the caller's cx/cy, and the two glow layers are
   lib/mascot.mjs's own — same blurs, same opacities, dark theme only, because a
   glow on white is a smudge. */
export function globeCss(opts = {}) {
  const o = merge(opts);
  const px = o.d;
  return `.g-zone{position:absolute;left:${(o.cx - px / 2).toFixed(2)}px;top:${(o.cy - px / 2).toFixed(2)}px;
  width:${px}px;height:${px}px;will-change:transform}
.g-zone canvas{position:absolute;inset:0;width:${px}px;height:${px}px;display:block}
.g-glow{pointer-events:none}
.g-glow-wide{filter:blur(${GLOW.wide.blur}px);opacity:${GLOW.wide.o}}
.g-glow-mid{filter:blur(${GLOW.mid.blur}px);opacity:${GLOW.mid.o}}`;
}

/* the land data rides inline in a json script tag rather than being fetched: it
   is 138KB, and a fetch under a paused virtual time policy is one more thing
   that can hang a render on frame one. */
/* ---------- two globes on one page ----------
   `ns` suffixes every id this markup owns and the global the script hangs off,
   so a clip can carry a second instance with different ink. it is ids only: the
   css is the zone's geometry and the glow's blurs, both of which are the same
   for two globes at the same place and the same size, so `globeCss` is emitted
   once and shared rather than duplicated under a second selector.

   the default is no suffix, which is the markup this file always wrote. */
const nsOf = o => (o && o.ns ? '-' + o.ns : '');

export function globeMarkup(geojson, opts = {}) {
  const S = nsOf(opts);
  return `<div class="g-zone">
    <canvas class="g-glow g-glow-wide" id="g-wide${S}"></canvas>
    <canvas class="g-glow g-glow-mid" id="g-mid${S}"></canvas>
    <canvas id="g-sharp${S}"></canvas>
    <canvas id="g-ping${S}"></canvas>
  </div>
<script type="application/json" id="land${S}">${geojson.replace(/</g, '\\u003c')}<\/script>`;
}

export function globeScript(opts = {}) {
  const o = merge(opts);
  /* the body below is globe-test.mjs's, moved rather than rewritten, so the
     names it interpolates are bound here exactly as they were there. */
  const GLOBE = { d: o.d }, DSF = o.dsf, SS = o.ss, MASK = o.mask;
  const S = nsOf(o);
  const LIMB = o.limb, GRID = o.grid, PING = o.ping, INK = o.ink, TILES = o.tiles;
  const TILT = o.tilt, SPIN0 = o.spin0, TURN_RATE = o.rate, SECONDS = o.seconds;
  return `
(function(){
  const D = ${GLOBE.d}, DSF = ${DSF}, SS = ${SS};
  const MW = ${MASK.w}, MH = ${MASK.h};
  const LIMB = ${JSON.stringify(LIMB)};
  const TILT = ${TILT};
  const N = Math.round(D * DSF);          /* device px across the disc */
  const R = N / 2;

  /* ---------- the land mask ----------
     equirectangular, drawn once. this projection needs no clipping either: a
     longitude is an x and a latitude is a y, and natural earth already splits
     its rings at the antimeridian so nothing wraps across the seam. holes are
     the second and later rings of a feature, so every feature is one path
     filled evenodd — there is exactly one hole in this file and this is what
     makes it a hole rather than a second island. */
  function buildMask(fc){
    const c = document.createElement('canvas');
    c.width = MW; c.height = MH;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.fillStyle = '#000'; g.fillRect(0, 0, MW, MH);
    g.fillStyle = '#fff';
    for (const f of fc.features){
      const geom = f.geometry;
      const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
      for (const poly of polys){
        g.beginPath();
        for (const ring of poly){
          for (let i = 0; i < ring.length; i++){
            const x = (ring[i][0] + 180) / 360 * MW;
            const y = (90 - ring[i][1]) / 180 * MH;
            if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
          }
          g.closePath();
        }
        g.fill('evenodd');
      }
    }
    const d = g.getImageData(0, 0, MW, MH).data;
    /* one byte a texel is all this needs, and it keeps the working set small
       enough to stay in cache while a frame walks it in longitude order. */
    const m = new Uint8Array(MW * MH);
    for (let i = 0; i < m.length; i++) m[i] = d[i * 4];
    return m;
  }

  /* ---------- the inverse projection, once ----------
     for a pixel at (x, y) on the unit disc, the point on the sphere facing us
     is (x, -y, sqrt(1 - x^2 - y^2)). undoing the tilt about the x axis gives
     the latitude and the longitude **relative to whatever is facing the
     camera**, which is the pair that does not change when the globe spins.

     cov, below, is how much of the pixel is inside the disc, from the same
     subsample grid, so the edge of the sphere is antialiased by the same pass
     that antialiases the coastline. (no backticks in this comment on purpose:
     it lives inside a template literal.) */
  function project(){
    const S = N * SS;
    const lat = new Float32Array(S * S);
    const lam = new Float32Array(S * S);
    const on  = new Uint8Array(S * S);
    const ct = Math.cos(TILT * Math.PI / 180), st = Math.sin(TILT * Math.PI / 180);
    for (let j = 0; j < S; j++){
      const y = ((j + 0.5) / SS - R) / R;
      for (let i = 0; i < S; i++){
        const k = j * S + i;
        const x = ((i + 0.5) / SS - R) / R;
        const r2 = x * x + y * y;
        if (r2 > 1){ on[k] = 0; continue; }
        on[k] = 1;
        const pz = Math.sqrt(1 - r2), py = -y;
        const b = ct * py + st * pz;          /* sin(phi) */
        const a = -st * py + ct * pz;         /* cos(phi) cos(lam) */
        lat[k] = Math.asin(Math.max(-1, Math.min(1, b))) * 180 / Math.PI;
        lam[k] = Math.atan2(x, a) * 180 / Math.PI;
      }
    }

    /* how fast latitude and longitude move across the screen, in degrees a
       device pixel, by finite difference on the arrays we just filled. the
       neighbours are one subsample apart, which is 1/SS of a pixel, so the
       difference is multiplied back up by SS.

       a pixel with no usable neighbour is one lone subsample at the very rim.
       its gradient is set enormous, which makes the line spacing there
       vanishingly small, which makes the fade below switch the grid off for it.
       that is the correct answer rather than a fallback: there is nothing
       truthful to draw in a pixel that thin. */
    const gLon = new Float32Array(S * S);
    const gLat = new Float32Array(S * S);
    for (let j = 0; j < S; j++){
      for (let i = 0; i < S; i++){
        const k = j * S + i;
        if (!on[k]) continue;
        const kx = (i + 1 < S && on[k + 1]) ? k + 1 : ((i > 0 && on[k - 1]) ? k - 1 : -1);
        const ky = (j + 1 < S && on[k + S]) ? k + S : ((j > 0 && on[k - S]) ? k - S : -1);
        if (kx < 0 || ky < 0){ gLon[k] = 1e9; gLat[k] = 1e9; continue; }
        const dxLon = wrapDeg(lam[kx] - lam[k]) * SS, dyLon = wrapDeg(lam[ky] - lam[k]) * SS;
        const dxLat = (lat[kx] - lat[k]) * SS, dyLat = (lat[ky] - lat[k]) * SS;
        gLon[k] = Math.hypot(dxLon, dyLon);
        gLat[k] = Math.hypot(dxLat, dyLat);
      }
    }
    return { S, lat, lam, on, gLon, gLat };
  }

  const wrapDeg = d => d - 360 * Math.round(d / 360);

  /* one subsample's worth of graticule. the distance to the nearest line is
     computed in degrees and then divided into pixels by the local gradient, so
     the line is GRID.width across on the screen wherever it falls. the +0.5 is
     a box filter over the pixel, which is what antialiases it. */
  function line(lon, lat, gl, gt){
    const half = GRID.width / 2;
    const band = (d, g) => {
      if (!(g > 0)) return 0;
      const spacing = GRID.step / g;
      if (spacing <= GRID.fadeLo) return 0;
      const cov = Math.max(0, Math.min(1, half + 0.5 - Math.abs(d) / g));
      if (cov <= 0) return 0;
      const fade = Math.min(1, (spacing - GRID.fadeLo) / (GRID.fadeHi - GRID.fadeLo));
      return cov * fade;
    };
    let v = band(wrapDeg(lon - Math.round(lon / GRID.step) * GRID.step), gl);
    /* the parallel at either pole is a point, not a circle, so it is not drawn.
       the meridians already meet there and drawing a nought radius circle on
       top of them is a bright dot at the pole and nothing else. */
    const nearLat = Math.round(lat / GRID.step) * GRID.step;
    if (Math.abs(nearLat) < 90) v = Math.max(v, band(lat - nearLat, gt));
    return v;
  }

  /* bilinear, wrapping in longitude so the seam at the antimeridian is a seam
     in the data and not a seam on the screen. */
  function sample(m, u, v){
    let x = u - 0.5, y = v - 0.5;
    const y0 = Math.max(0, Math.min(MH - 1, Math.floor(y)));
    const y1 = Math.max(0, Math.min(MH - 1, y0 + 1));
    const fy = Math.max(0, Math.min(1, y - y0));
    let x0 = Math.floor(x) % MW; if (x0 < 0) x0 += MW;
    let x1 = (x0 + 1) % MW;
    const fx = x - Math.floor(x);
    const a = m[y0 * MW + x0], b = m[y0 * MW + x1];
    const c = m[y1 * MW + x0], d = m[y1 * MW + x1];
    return ((a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy) / 255;
  }

  const fc = JSON.parse(document.getElementById('land${S}').textContent);
  const mask = buildMask(fc);
  const P = project();

  const sharp = document.getElementById('g-sharp${S}');
  const mid = document.getElementById('g-mid${S}');
  const wide = document.getElementById('g-wide${S}');
  for (const c of [sharp, mid, wide]){ c.width = N; c.height = N; }
  const gs = sharp.getContext('2d');
  const gm = mid.getContext('2d');
  const gw = wide.getContext('2d');
  const imgSharp = gs.createImageData(N, N);
  const imgDisc = gs.createImageData(N, N);

  /* the disc, in flat white, is the glow source and it never changes, so it is
     painted once. this is the face's plate: the silhouette of the object, not
     a picture of it. */
  (function(){
    const d = imgDisc.data, S = P.S;
    for (let j = 0; j < N; j++){
      for (let i = 0; i < N; i++){
        let cov = 0;
        for (let sj = 0; sj < SS; sj++){
          const row = (j * SS + sj) * S + i * SS;
          for (let si = 0; si < SS; si++) cov += P.on[row + si];
        }
        const k = (j * N + i) * 4;
        d[k] = 255; d[k + 1] = 255; d[k + 2] = 255;
        d[k + 3] = Math.round(255 * cov / (SS * SS));
      }
    }
    gm.putImageData(imgDisc, 0, 0);
    gw.putImageData(imgDisc, 0, 0);
  })();

  const LAND = [${INK.land}], OCEAN = [${INK.ocean}];
  const GRID = ${JSON.stringify(GRID)};

  /* ---------- the mirror ball ----------
     one lookup a subsample, and it writes into three outer variables rather
     than returning an array: a 460px disc at four subsamples a pixel asks this
     about eight hundred thousand times a frame, and eight hundred thousand
     three-element arrays is the whole cost of the picture. (no backticks in
     this comment on purpose: it lives inside a template literal.) */
  const TILES = ${JSON.stringify(TILES)};
  const ROW_DEG = 180 / TILES.rows;
  let TI_R = 0, TI_G = 0, TI_B = 0;

  /* the same lcg the pings and lib/mascot.mjs's idle use, hashed on the pair
     rather than walked, so a tile's brightness is a fact about that tile and
     not about the order the loop happened to reach it in. */
  function tileRnd(row, col){
    let h = (Math.imul(row, 374761393) + Math.imul(col, 668265263) + TILES.seed) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  /* the graticule's own band, at a step handed in rather than read off GRID,
     because a tile's two steps are different from each other and the column one
     changes with the row. */
  function grout(d, g, stepDeg){
    if (!(g > 0)) return 0;
    const spacing = stepDeg / g;
    if (spacing <= TILES.fadeLo) return 0;
    const cov = Math.max(0, Math.min(1, TILES.gap / 2 + 0.5 - Math.abs(d) / g));
    if (cov <= 0) return 0;
    const fade = Math.min(1, (spacing - TILES.fadeLo) / (TILES.fadeHi - TILES.fadeLo));
    return cov * fade;
  }

  function tileInk(lon, lat, gl, gt){
    let row = Math.floor((lat + 90) / ROW_DEG);
    if (row < 0) row = 0;
    if (row > TILES.rows - 1) row = TILES.rows - 1;
    const latC = -90 + (row + 0.5) * ROW_DEG;
    /* cos(lat) many columns, so a tile is as wide as it is tall wherever it
       sits. the floor of four keeps the two polar rows from collapsing to one
       tile with no grout in it at all. */
    const cols = Math.max(4, Math.round(360 * Math.cos(latC * Math.PI / 180) / ROW_DEG));
    const colDeg = 360 / cols;
    const x = lon + 180;
    let col = Math.floor(x / colDeg) % cols;
    if (col < 0) col += cols;
    const u = tileRnd(row, col);
    if (u > 1 - TILES.hot){
      TI_R = TILES.hotInk[0]; TI_G = TILES.hotInk[1]; TI_B = TILES.hotInk[2];
    } else {
      const k = Math.pow(u / (1 - TILES.hot), TILES.curve);
      TI_R = TILES.base[0] + (TILES.top[0] - TILES.base[0]) * k;
      TI_G = TILES.base[1] + (TILES.top[1] - TILES.base[1]) * k;
      TI_B = TILES.base[2] + (TILES.top[2] - TILES.base[2]) * k;
    }
    const dLat = lat + 90 - Math.round((lat + 90) / ROW_DEG) * ROW_DEG;
    const dLon = x - Math.round(x / colDeg) * colDeg;
    const a = Math.max(grout(dLat, gt, ROW_DEG), grout(dLon, gl, colDeg));
    if (a > 0){
      TI_R += (TILES.grout[0] - TI_R) * a;
      TI_G += (TILES.grout[1] - TI_G) * a;
      TI_B += (TILES.grout[2] - TI_B) * a;
    }
  }

  function draw(spinDeg){
    const d = imgSharp.data, S = P.S, n = SS * SS;
    for (let j = 0; j < N; j++){
      for (let i = 0; i < N; i++){
        let cov = 0, land = 0, shade = 0, grid = 0, tr = 0, tg = 0, tb = 0;
        for (let sj = 0; sj < SS; sj++){
          const row = (j * SS + sj) * S + i * SS;
          for (let si = 0; si < SS; si++){
            const k = row + si;
            if (!P.on[k]) continue;
            cov++;
            let lon = P.lam[k] - spinDeg;
            lon = lon - 360 * Math.floor((lon + 180) / 360);
            if (TILES.on){
              tileInk(lon, P.lat[k], P.gLon[k], P.gLat[k]);
              tr += TI_R; tg += TI_G; tb += TI_B;
            } else {
            const ls = sample(mask, (lon + 180) / 360 * MW, (90 - P.lat[k]) / 180 * MH);
            land += ls;
            /* masked to the white areas by multiplying by the land coverage of
               this very subsample, so the grid stops at a coastline with the
               same antialiased edge the coastline itself has. */
            if (GRID.on && ls > 0) grid += ls * line(lon, P.lat[k], P.gLon[k], P.gLat[k]);
            }
            /* the limb, computed on the subsample so it is smooth across the
               pixel like everything else here. */
            const x = ((i * SS + si + 0.5) / SS - R) / R;
            const y = ((j * SS + sj + 0.5) / SS - R) / R;
            const e = Math.abs(x), r = Math.sqrt(x * x + y * y);
            shade += (1 - LIMB.amount * Math.pow(e, LIMB.power))
                   * (1 - LIMB.radial * Math.pow(r, 3));
          }
        }
        const k = (j * N + i) * 4;
        if (!cov){ d[k + 3] = 0; continue; }
        const L = land / cov, sh = shade / cov;
        let r, g, b;
        if (TILES.on){
          /* the grout is already in these three, for the same reason the
             graticule below goes on before the limb: a mirror at the edge of
             the ball dims with the ball, grout and all. */
          r = tr / cov; g = tg / cov; b = tb / cov;
        } else {
        r = OCEAN[0] + (LAND[0] - OCEAN[0]) * L;
        g = OCEAN[1] + (LAND[1] - OCEAN[1]) * L;
        b = OCEAN[2] + (LAND[2] - OCEAN[2]) * L;
        /* the grid goes on before the limb shading, not after, so a line at the
           edge of the sphere dims with the ground it is drawn on. a graticule
           composited over the top would stay at full strength into the dark
           edge and read as a wire in front of the globe rather than as
           something printed on it. */
        if (grid > 0){
          const a = (grid / cov) * GRID.o;
          r += (GRID.ink[0] - r) * a;
          g += (GRID.ink[1] - g) * a;
          b += (GRID.ink[2] - b) * a;
        }
        }
        r *= sh; g *= sh; b *= sh;
        d[k] = r; d[k + 1] = g; d[k + 2] = b;
        d[k + 3] = Math.round(255 * cov / n);
      }
    }
    gs.putImageData(imgSharp, 0, 0);
  }

  /* ---------- the pings ----------
     the same lcg lib/mascot.mjs seeds its idle from, so the schedule is uneven
     the way a real one is and identical on every run. */
  const PING = ${JSON.stringify(PING)};
  const SECONDS = ${SECONDS};
  function prng(seed){
    let s = seed >>> 0;
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  const ping = document.getElementById('g-ping${S}');
  ping.width = N; ping.height = N;
  const gp = ping.getContext('2d');
  const DEG = Math.PI / 180;
  const CT = Math.cos(TILT * DEG), ST = Math.sin(TILT * DEG);
  const SPIN0 = ${SPIN0}, RATE = ${TURN_RATE};

  /* the forward projection, which is the inverse of the one the pixels use and
     has to agree with it exactly or a ping sits next to its own country. */
  function forward(lon, lat, spin){
    const lam = (lon + spin) * DEG, phi = lat * DEG;
    const px = Math.cos(phi) * Math.sin(lam);
    const py = CT * Math.sin(phi) - ST * Math.cos(phi) * Math.cos(lam);
    const pz = ST * Math.sin(phi) + CT * Math.cos(phi) * Math.cos(lam);
    return { x: R + R * px, y: R - R * py, z: pz, vis: pz >= 0 };
  }

  /* is the picture black at this screen point. reads imgSharp.data, which is
     the frame itself: the same bytes that go to the canvas and into the
     screenshot. alpha under 250 means the point is off the disc or on its
     antialiased rim, and neither is inside the globe. (no backticks in this
     comment on purpose: it lives inside a template literal.) */
  var LUM = PING.lum || [0, PING.maxLum];

  /* ---------- the land polygons, flattened once ----------
     one entry per polygon, its rings as flat coordinate pairs and its own
     lon/lat box in front of them. the box is the whole of why this is fast
     enough to sit inside a spawn loop: 127 features and about ten thousand
     points, and a candidate is tested against the two or three polygons whose
     box it is even inside. */
  var LAND_POLYS = (function(){
    var out = [];
    for (var i = 0; i < fc.features.length; i++){
      var geom = fc.features[i].geometry;
      var polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
      for (var p = 0; p < polys.length; p++){
        var rings = [], box = [180, 90, -180, -90];
        for (var r = 0; r < polys[p].length; r++){
          var ring = polys[p][r], pts = new Float64Array(ring.length * 2);
          for (var k = 0; k < ring.length; k++){
            var x = ring[k][0], y = ring[k][1];
            pts[k * 2] = x; pts[k * 2 + 1] = y;
            if (x < box[0]) box[0] = x;
            if (y < box[1]) box[1] = y;
            if (x > box[2]) box[2] = x;
            if (y > box[3]) box[3] = y;
          }
          rings.push(pts);
        }
        out.push({ rings: rings, box: box });
      }
    }
    return out;
  })();

  /* ray casting, and the crossings are counted across **every ring of a
     polygon together** rather than per ring. that is even-odd, which is the
     rule buildMask fills with, so the one hole in this file is a hole to both
     tests and an island inside a lake would be land to both. natural earth
     splits its rings at the antimeridian, so nothing here wraps and a
     horizontal ray needs no special case. */
  function inLand(lon, lat){
    for (var i = 0; i < LAND_POLYS.length; i++){
      var P2 = LAND_POLYS[i], b = P2.box;
      if (lon < b[0] || lon > b[2] || lat < b[1] || lat > b[3]) continue;
      var cross = 0;
      for (var r = 0; r < P2.rings.length; r++){
        var pts = P2.rings[r], n = pts.length / 2;
        for (var a = 0, c = n - 1; a < n; c = a++){
          var yi = pts[a * 2 + 1], yj = pts[c * 2 + 1];
          if ((yi > lat) === (yj > lat)) continue;
          var xi = pts[a * 2], xj = pts[c * 2];
          if (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) cross++;
        }
      }
      if (cross % 2 === 1) return true;
    }
    return false;
  }
  function darkHere(x, y){
    const xi = Math.round(x), yi = Math.round(y);
    if (xi < 0 || yi < 0 || xi >= N || yi >= N) return false;
    const d = imgSharp.data, k = (yi * N + xi) * 4;
    if (d[k + 3] < 250) return false;
    const y2 = d[k] * 0.299 + d[k + 1] * 0.587 + d[k + 2] * 0.114;
    return y2 >= LUM[0] && y2 <= LUM[1];
  }

  /* a place to be born: area correct, **facing the camera**, and **black on the
     frame it is born on**.

     facing the camera is the difference between a schedule and a clip. a point
     picked anywhere on the sphere is on the far side half the time, and a ping
     that spawns back there lives its whole 0.8s behind the globe and is never
     seen — one render of this had two pings on screen at best and nineteen of
     thirty six frames with none at all. requiring z above minZ means every ping
     is actually watched to start. it does not stop one leaving: the globe turns
     19 degrees in a ping's lifetime, so one born near the edge of the face
     still rotates out under its own fade.

     black on the frame is the colour rule, and it needs the frame, so the globe
     is drawn at this ping's own moment before any candidate is judged. that is
     one full render per scheduled ping, about a dozen over a clip, and it is
     worth it: it is the only test that cannot disagree with what ships. */
  function spawnPoint(rnd, t){
    const spin = SPIN0 + RATE * t;
    draw(spin);                       /* the frame this ping is born on */
    const c = PING.clear;
    for (let i = 0; i < 20000; i++){
      const lon = rnd() * 360 - 180;
      const lat = Math.asin(rnd() * 2 - 1) * 180 / Math.PI;
      const q = forward(lon, lat, spin);
      if (q.z < PING.minZ) continue;
      if (!darkHere(q.x, q.y)) continue;
      if (!darkHere(q.x + c, q.y) || !darkHere(q.x - c, q.y)
        || !darkHere(q.x, q.y + c) || !darkHere(q.x, q.y - c)) continue;
      return { lon: lon, lat: lat };
    }
    return null;
  }

  const sched = (function(){
    if (!PING.on) return [];
    const rnd = prng(PING.seed);
    const out = [];
    /* **the schedule starts before the clip does.** a first spawn at t=0 or
       later leaves frame one as a bare globe, and on a three second clip the
       opening frame is a large share of what anyone sees before deciding. so
       the first ping is born at a random offset in the past and is already
       partway through its life when the clip opens: 15% to 75% through, which
       is alpha 0.79 down to 0.13, so it is always visibly there on frame one
       and never at full size. */
    let t = -PING.life * (0.15 + rnd() * 0.60);
    while (t < SECONDS + PING.life){
      const p = spawnPoint(rnd, t);
      if (p) out.push({ t: t, lon: p.lon, lat: p.lat });
      t += PING.every[0] + rnd() * (PING.every[1] - PING.every[0]);
    }
    return out;
  })();

  /* which pings were ever actually put on a frame. the schedule deliberately
     runs past the end of the clip so the last second is not thinner than the
     rest, so "scheduled" and "seen" are different numbers and the run should
     report the one a viewer gets. */
  const seen = new Set();

  function drawPings(t, spin){
    gp.clearRect(0, 0, N, N);
    if (!PING.on) return 0;
    const live = [];
    for (const p of sched){ if (t >= p.t && t < p.t + PING.life) live.push(p); }
    /* the ceiling keeps the newest, because the oldest are the faintest and are
       the ones a viewer has already read. */
    const use = live.slice(-PING.max);
    gp.save();
    /* clipped to the disc, which is what makes a ping near the edge disappear
       into the limb instead of hanging off the side of the sphere. */
    gp.beginPath(); gp.arc(R, R, R, 0, Math.PI * 2); gp.clip();
    gp.lineWidth = PING.width;
    gp.strokeStyle = 'rgb(' + PING.ink + ')';
    gp.fillStyle = 'rgb(' + PING.ink + ')';
    gp.font = PING.font.weight + ' ' + PING.font.size + 'px "' + PING.font.family + '", sans-serif';
    gp.textAlign = 'center';
    gp.textBaseline = 'middle';
    let drawn = 0;
    for (const p of use){
      const q = forward(p.lon, p.lat, spin);
      if (!q.vis) continue;                 /* on the far side, so behind the globe */
      seen.add(p.t);
      const u = (t - p.t) / PING.life;
      /* out fast then settling, which is what a ping does. the fade is a shade
         faster than linear so the ring is gone before it reaches full size
         rather than snapping off at it. */
      const grow = 1 - Math.pow(1 - u, 3);
      const a = Math.pow(1 - u, 1.5);
      const rad = Math.max(0.5, (PING.size / 2) * grow);
      gp.globalAlpha = a;
      gp.beginPath(); gp.arc(q.x, q.y, rad, 0, Math.PI * 2); gp.stroke();
      /* the label does not grow with the ring. a two letter word scaling up
         from nothing reads as a zoom; held still at the centre it reads as a
         thing the ring is about. */
      gp.fillText(PING.label, q.x, q.y);
      drawn++;
    }
    gp.restore();
    return drawn;
  }

  window.__globe${o.ns ? '_' + o.ns : ''} = {
    ready: true,
    n: N,
    pings: sched.length,
    /* the schedule, so the run can be checked against the encoded clip from
       outside this page. the colour rule is enforced in here against the frame
       buffer; handing the points out lets it be re-proved against the mp4 with
       an independently written projection, which is the only version of the
       check that shares no code with the thing it is checking. */
    schedule: sched,
    seen(){ return seen.size; },
    /* the geometry test, handed out so a run can re-check its own schedule from
       outside this page with the points it was given. */
    inLand: inLand,
    apply(t, spin){ draw(spin); return drawPings(t, spin); },
    /* what got built, for the run's own log. a render that reports nothing
       cannot be argued with afterwards. */
    stats(){
      let land = 0, on = 0;
      for (let i = 0; i < P.on.length; i++){ if (P.on[i]) on++; }
      for (let i = 0; i < mask.length; i++){ if (mask[i] > 127) land++; }
      /* six places whose answer is not a matter of opinion. if any of these is
         wrong the mask is wrong, and it is wrong in a way a picture of a globe
         will not obviously show — sea and land are both plausible shapes. */
      const probe = (lon, lat) => +sample(mask, (lon + 180) / 360 * MW, (90 - lat) / 180 * MH).toFixed(2);
      return {
        disc: N, samples: on,
        maskLandPct: +(100 * land / mask.length).toFixed(2),
        features: fc.features.length,
        probes: {
          'sahara 20E 20N': probe(20, 20),
          'amazon 60W 5S': probe(-60, -5),
          'siberia 100E 60N': probe(100, 60),
          'mid atlantic 30W 0N': probe(-30, 0),
          'mid pacific 150W 0N': probe(-150, 0),
          'south indian 80E 40S': probe(80, -40),
        },
      };
    },
  };
})();
`;
}
