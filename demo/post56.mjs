/* the boring tek — post56. AI takes over the world.

   dark, 1080x1920. seven lines on the elevenlabs narrator, eleven_v4, three
   takes a line kept by measurement, every take sped up 1.12 with atempo, pitch
   kept. post55's subtitles, the plain end card. the rig is lib/aiafter.mjs with
   the series off, on the cinematic kit and post56's motion study: the anchor
   camera with log space zoom, chained moves, real shutter blur on the map,
   hitPulse, ripples, the scramble, the letter morph and the comet trace.

     frame 0  the glowing world map, him sitting on top with a crown, AI TAKES
              OVER THE WORLD, EARTH under the map
     l1       what if AI ...          the title punches on AI, a happy arc
     l2       it renames ...          EARTH scrambles away, TERRA BYTE decodes in,
                                      the map pulses once from him outwards
     l3       finland becomes ...     zoom to finland, he hops to the top right,
                                      FINLAND morphs into FINE TUNED LAND. a whip
                                      across the world, FIJI becomes WI FIJI, wifi
     l4       iceland is now ...      a hop to iceland, SERVER LAND, five racks
                                      drop in with frost, he nods on love
     l5       greenland is ...        a glide, SCREENLAND, a whip to the usa,
                                      UNITED STATES OF types, AUTO finishes itself
                                      wrong twice and locks on AUTOCOMPLETE
     l6       world takeover ...      pull back, he hops home, every country glows,
                                      the wifi flies to the corner, the bar to 99%
     silence                          the bar sticks at 99
     l7       the takeover lasted ... the wifi loses its bars, the map goes dark
                                      country by country, the crown slides off,
                                      he squints at the lens
     the glitch cut, the plain end card

   the map is natural earth 50m admin 0, public domain, in demo/assets and
   gitignored, drawn on an equal earth projection centred on 11e so fiji does
   not split. bright coastlines, faint inside borders, labels only on the five
   countries the read names. green only as accents. no flags, no logos.

     DEMO_FPS=12 node post56.mjs          the preview
     node post56.mjs --stills             one still per beat, no render
     node post56.mjs                      60fps
*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runEpisode, readLines, place, wAt, span, lerp, smooth, bump, EASE, IO, FPS,
  livingCamera, wordIn, CURVE, CURVE56, peakAt, toScreen, shotChain, shutter,
  hitPulse, rippleAt, scramble, morphPlan, morphAt, trace,
} from './lib/aiafter.mjs';

/* ---------- the read ---------- */
const MODEL = { model: 'eleven_v4' };
const TEMPO = 1.12;
const LINES = [
  { key: 'r1', text: '[excited] what if AI took over the world?', tempo: TEMPO },
  { key: 'r2', text: '[cheerful] it renames the planet. terra byte.', tempo: TEMPO },
  /* spaced so it is not read as why fiji. t2 pinned: the speech to text hears wi fiji */
  { key: 'r3', text: '[playful] finland becomes fine tuned land. fiji gets wi fi ji.', tempo: TEMPO, take: 2 },
  { key: 'r4', text: '[amused] iceland is now server land. servers love it.', tempo: TEMPO },
  { key: 'r5', text: '[cheerful] greenland is screenland. and the USA? the united states of autocomplete.', tempo: TEMPO },
  { key: 'r6', text: '[excited] world takeover, ninety nine percent.', tempo: TEMPO },
  { key: 'r7', text: '[sighs] the takeover lasted four seconds. then the wifi dropped.', tempo: TEMPO },
];
const TAKES = await readLines(56, LINES, 3, MODEL);
const [L1, L2, L3, L4, L5, L6, L7] = TAKES;
/* a little longer after TERRA BYTE, so the name holds before the zoom */
const GAP = 0.3, GAP_TB = 0.5, HUSH = 0.58;
place(L1, 0.30);
for (let i = 1; i < TAKES.length; i++) place(TAKES[i], TAKES[i - 1].end + (i === 6 ? HUSH : i === 2 ? GAP_TB : GAP));
const SUBS = [
  { line: 0, text: 'what if ai took over the world?' },
  { line: 1, text: 'it renames the planet' },
  { line: 1, text: 'terra byte' },
  { line: 2, text: 'finland becomes fine tuned land' },
  { line: 2, text: 'fiji gets wi fiji' },
  { line: 3, text: 'iceland is now server land' },
  { line: 3, text: 'servers love it' },
  { line: 4, text: 'greenland is screenland' },
  { line: 4, text: 'and the usa?' },
  { line: 4, text: 'the united states of autocomplete' },
  { line: 5, text: 'world takeover' },
  { line: 5, text: 'ninety nine percent' },
  { line: 6, text: 'the takeover lasted four seconds' },
  { line: 6, text: 'then the wifi dropped' },
];

/* ---------- the map: natural earth, equal earth, in stage css px ---------- */
const HERE = path.dirname(fileURLToPath(import.meta.url));
const GEO_FILE = path.join(HERE, 'assets', 'ne_50m_admin_0_countries.geojson');
if (!fs.existsSync(GEO_FILE)) {
  console.error('\nSTOPPED. demo/assets/ne_50m_admin_0_countries.geojson is missing. it is natural earth, public domain, from\n  https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson');
  process.exit(1);
}
const A1 = 1.340264, A2 = -0.081106, A3 = 0.000893, A4 = 0.003796, MM = Math.sqrt(3) / 2, LON0 = 11;
function ee(lon, lat) {
  let l = lon - LON0;
  if (l < -180) l += 360;
  if (l > 180) l -= 360;
  const lam = l * Math.PI / 180, th = Math.asin(MM * Math.sin(lat * Math.PI / 180)), t2 = th * th, t6 = t2 * t2 * t2;
  return [2 * Math.sqrt(3) * lam * Math.cos(th) / (3 * (9 * A4 * t6 * t2 + 7 * A3 * t6 + 3 * A2 * t2 + A1)), th * (A1 + A2 * t2 + t6 * (A3 + A4 * t2))];
}
const MAPW = 530, SC = MAPW / (2 * ee(LON0 + 180, 0)[0]), Y84 = ee(0, 84)[1], MAP_TOP = 384;
const P = (lon, lat) => { const [x, y] = ee(lon, lat); return [270 + x * SC, MAP_TOP + (Y84 - y) * SC]; };

const GEO = JSON.parse(fs.readFileSync(GEO_FILE, 'utf8'));
const FEATS = GEO.features.filter(f => f.properties.ADMIN !== 'Antarctica');
const CN = FEATS.map(f => ({ name: f.properties.ADMIN, rings: [] }));
FEATS.forEach((f, ci) => {
  const g = f.geometry, polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  for (const poly of polys) {
    if (poly[0].every(p => p[1] < -60)) continue;
    for (const ring of poly) CN[ci].rings.push(ring);
  }
});
/* a segment two countries share is a border, one only one has is coast */
const kp = p => p[0].toFixed(5) + ',' + p[1].toFixed(5);
const segKey = (a, b) => { const x = kp(a), y = kp(b); return x < y ? x + '|' + y : y + '|' + x; };
const OWN = new Map();
CN.forEach((c, ci) => { for (const r of c.rings) for (let i = 0; i + 1 < r.length; i++) { const k = segKey(r[i], r[i + 1]), o = OWN.get(k); if (!o) OWN.set(k, [ci]); else if (!o.includes(ci)) o.push(ci); } });
/* douglas peucker. a closed ring is split in two first: with both ends on the
   same point every distance is zero and the whole island collapses */
function simplify(pts, tol) {
  if (pts.length < 3) return pts;
  const [fx, fy] = pts[0], [lx, ly] = pts[pts.length - 1];
  if (pts.length > 4 && Math.hypot(fx - lx, fy - ly) < 1e-9) { const m = pts.length >> 1; return [...simplify(pts.slice(0, m + 1), tol).slice(0, -1), ...simplify(pts.slice(m), tol)]; }
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const st = [[0, pts.length - 1]];
  while (st.length) {
    const [a, b] = st.pop(); let best = -1, bi = -1;
    const [ax, ay] = pts[a], [bx, by] = pts[b], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1e-9;
    for (let i = a + 1; i < b; i++) { const d = Math.abs((pts[i][0] - ax) * dy - (pts[i][1] - ay) * dx) / L; if (d > best) { best = d; bi = i; } }
    if (best > tol) { keep[bi] = 1; st.push([a, bi], [bi, b]); }
  }
  return pts.filter((p, i) => keep[i]);
}
const TOL = 0.012;
const flat = pts => pts.flatMap(p => [+p[0].toFixed(2), +p[1].toFixed(2)]);
const MAPC = CN.map((c, ci) => {
  const co = [], bo = [];
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, main = null, mainA = -1, all = [];
  for (const r of c.rings) {
    const pr = r.map(p => P(p[0], p[1]));
    let area = 0;
    for (let i = 0; i + 1 < pr.length; i++) area += pr[i][0] * pr[i + 1][1] - pr[i + 1][0] * pr[i][1];
    if (Math.abs(area) > mainA && !r.some(p => Math.abs(p[0]) > 179.999)) { mainA = Math.abs(area); main = pr; }
    let run = null;
    const close = () => { if (run && run.pts.length > 1) (run.other < 0 ? co : bo).push(run); run = null; };
    for (let i = 0; i + 1 < r.length; i++) {
      const a = r[i], b = r[i + 1], pa = pr[i], pb = pr[i + 1];
      if ((Math.abs(a[0]) > 179.999 && Math.abs(b[0]) > 179.999) || Math.abs(pa[0] - pb[0]) > 200) { close(); continue; }
      const own = OWN.get(segKey(a, b)), other = own.length > 1 ? own.find(x => x !== ci) : -1;
      if (other >= 0 && other < ci) { close(); continue; }
      if (run && run.other === other) run.pts.push(pb);
      else { close(); run = { other, pts: [pa, pb] }; }
      for (const q of [pa, pb]) { x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); }
    }
    close();
    all.push({ pr, area: Math.abs(area) });
  }
  return {
    name: c.name, b: [x0, y0, x1, y1].map(v => +v.toFixed(2)), cen: { x: (x0 + x1) / 2, y: (y0 + y1) / 2 },
    co: co.map(r => flat(simplify(r.pts, TOL))), bo: bo.map(r => [r.other, flat(simplify(r.pts, TOL))]),
    main, all,
  };
});
const idx = n => { const i = MAPC.findIndex(c => c.name === n); if (i < 0) throw new Error('no ' + n + ' in natural earth'); return i; };
const C_FIN = idx('Finland'), C_FIJ = idx('Fiji'), C_ICE = idx('Iceland'), C_GRN = idx('Greenland'), C_USA = idx('United States of America');
/* a country's shot: its main shape (all of fiji's islands) fitted into a box at the screen centre */
const SCX = 270, SCY = 468, BOXW = 330, BOXH = 250;
function shotOf(ci, whole = false) {
  /* `whole`: every island at least a tenth of the biggest, fiji's two, not far rotuma */
  const pts = whole ? MAPC[ci].all.filter(r => r.area >= 0.1 * Math.max(...MAPC[ci].all.map(q => q.area))).flatMap(r => r.pr) : MAPC[ci].main;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return { ax: (x0 + x1) / 2, ay: (y0 + y1) / 2, sx: SCX, sy: SCY, k: Math.min(BOXW / (x1 - x0), BOXH / (y1 - y0), 60) };
}
const FULL = { ax: 270, ay: 480, sx: 270, sy: 480, k: 1 };
const SH = { fin: shotOf(C_FIN), fij: shotOf(C_FIJ, true), ice: shotOf(C_ICE), grn: shotOf(C_GRN), usa: shotOf(C_USA) };
const TRACE = Object.fromEntries([C_FIN, C_FIJ, C_ICE, C_GRN, C_USA].map(c => [c, flat(simplify([...MAPC[c].main, MAPC[c].main[0]], TOL))]));
const GDATA = { c: MAPC.map(c => ({ b: c.b, co: c.co, bo: c.bo })), tr: TRACE };
const NC = MAPC.length;

/* ---------- the words on screen ---------- */
const T1 = 'AI TAKES OVER', T2 = 'THE WORLD', EARTH = 'EARTH', TB = 'TERRA BYTE';
const NAMES = [['FINLAND', 'FINE TUNED LAND'], ['FIJI', 'WI FIJI'], ['ICELAND', 'SERVER LAND'], ['GREENLAND', 'SCREENLAND']];
const U1 = 'UNITED STATES OF', U2 = ['AUTOCOMPLETE', 'AUTOCORRECT', 'AUTOPILOT', 'AUTOCOMPLETE'], WT = 'WORLD TAKEOVER';

/* ---------- the layout, css px of the 540x960 stage ---------- */
const MAS = { cx: 270, cy: 330, size: 118, scale: 0.85 };
const WIFI_TR = { x: 446, y: 104 };
const HOME = { x: 270, y: 330, s: 0.85 }, TR = { x: 440, y: 168, s: 0.51 };
const TY = { t1: 170, t2: 214 }, LAB_Y = 650, BAR = { y: 646, l: 90, r: 450 };

/* ---------- the beats, all off the read ---------- */
const w = (T, x, after) => +(wAt(T, x, after) - 0.04).toFixed(3);
const AI = w(L1, 'ai'), WORLD1 = w(L1, 'world');
const RENAME = w(L2, 'renames'), TERRA = w(L2, 'terra');
/* the decode starts a breath before the word and locks as it ends */
const TB_AT = +(TERRA - 0.12).toFixed(3), TB_PER = 0.035, TB_HOLD = 0.1, TLOCK = +(TB_AT + 9 * TB_PER + TB_HOLD).toFixed(3);
const FIN = w(L3, 'finland'), FINE = w(L3, 'fine'), FIJI = w(L3, 'fiji'), WIFI = w(L3, 'wi');
const ICE = w(L4, 'iceland'), SERVER = w(L4, 'server'), SERVERS = w(L4, 'servers'), LOVE = w(L4, 'love');
const GREEN = w(L5, 'greenland'), SCREEN = w(L5, 'screenland'), USA = w(L5, 'usa'), AUTOC = w(L5, 'autocomplete');
const WORLD6 = w(L6, 'world'), TAKE6 = w(L6, 'takeover'), NINETY = w(L6, 'ninety'), PERCENT = w(L6, 'percent');
const LASTED = w(L7, 'lasted'), FOUR = w(L7, 'four'), SECONDS = w(L7, 'seconds'), THEN = w(L7, 'then'), DROPPED = w(L7, 'dropped');

/* the camera chain: each move starts from wherever the last one is */
const M1 = { at: +(FIN - 0.3).toFixed(3), d: 0.75, to: SH.fin, curve: CURVE.cam };
/* fiji is a straight cut on the whoosh, to a shot a little wide that settles in
   while the pin drops. the cut is one instant, the settle decelerates out of it */
const CUTF = +(FIJI - 0.12).toFixed(3);
const M2 = { at: CUTF, d: 0.001, to: { ...SH.fij, k: SH.fij.k * 0.82 }, curve: u => u };
const M2S = { at: +(CUTF + 0.001).toFixed(3), d: 0.55, to: SH.fij, curve: CURVE.out };
const PIN = +(CUTF + 0.22).toFixed(3), PIN_LAND = +(PIN + 0.24).toFixed(3);
/* the pin lands on viti levu, the main island, not on the sea between the two */
const VITI = (() => { const m = MAPC[C_FIJ].main; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of m) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } return { x: (x0 + x1) / 2, y: (y0 + y1) / 2 }; })();
const M3 = { at: +(ICE - 0.55).toFixed(3), d: 0.8, to: SH.ice, curve: CURVE56.whip, hop: 2.8 };
const M4 = { at: +(GREEN - 0.45).toFixed(3), d: 0.6, to: SH.grn, curve: CURVE56.glide };
const M5 = { at: +(USA - 0.3).toFixed(3), d: 0.55, to: SH.usa, curve: CURVE56.whip, hop: 0.35 };
const M6 = { at: +(WORLD6 - 0.45).toFixed(3), d: 1.1, to: FULL, curve: CURVE56.pull };
const cam = shotChain(FULL, [M1, M2, M2S, M3, M4, M5, M6]);
const HOP1 = +(M1.at + 0.05).toFixed(3), BACK = +(M6.at + 0.2).toFixed(3);
const BAR99 = +(NINETY + 0.3).toFixed(3);
const DARK = +DROPPED.toFixed(3), CROWN_OFF = +(DROPPED + 0.5).toFixed(3), DARK_V = 1300;
const DARK_END = Math.max(CROWN_OFF + 0.55, ...MAPC.map((c, i) => rippleAt(DARK, WIFI_TR, c.cen, DARK_V, 0.12, i + 99) + 0.14));
const CUT = +Math.max(L7.end + 0.3, DARK_END + 0.25).toFixed(3);
const HOLD = 1.2;
/* the usa: line one types in, AUTO, then three wrong finishes and the lock on the word */
const U1A = +(USA + 0.12).toFixed(3), U2A = +Math.max(U1A + 0.5, AUTOC - 1.05).toFixed(3);
const CYC = Math.max(0.16, (AUTOC - U2A - 0.2) / 3);
const SUF = [0, 1, 2].map(k => +(U2A + 0.2 + k * CYC).toFixed(3)).concat([AUTOC]);
/* the racks: five, four frames apart */
const RACK = [[-118, 10], [-60, -14], [0, 6], [60, -12], [118, 10]];
const RACK_AT = RACK.map((r, i) => +(SERVERS - 0.06 + i * 4 / 60).toFixed(3));
const RACK_LAND = RACK_AT.map(a => +(a + 0.18).toFixed(3));
const RACK_PT = RACK.map(([dx, dy]) => ({ x: SH.ice.ax + dx / SH.ice.k, y: SH.ice.ay + dy / SH.ice.k }));
const WIFI_POP = +(WIFI + 0.3).toFixed(3), WIFI_FLY = +(M6.at + M6.d - 0.25).toFixed(3);
/* fiji sits on the map's right edge, the flight starts just inside the margin */
const FIJI_PT = { x: Math.min(456, toScreen(FULL, MAPC[C_FIJ].cen).x), y: toScreen(FULL, MAPC[C_FIJ].cen).y };
const ARCS = [LASTED, FOUR, SECONDS];

const f2 = v => +v.toFixed(2), f3 = v => +v.toFixed(3);
const hidden = { o: 0, s: 1, y: 0, blur: 0 };

/* ---------- the camera on the whole stage, the living push ---------- */
const camera = livingCamera({
  F: { x: 270, y: 470 },
  holds: [[0, HOP1 - 0.15], [M6.at + M6.d + 0.1, CUT]],
  push: 0.03,
  punches: [AUTOC, BAR99],
});

/* ---------- where he is ---------- */
const hopArc = (t, a, b, A, B, h) => {
  const k = EASE(span(t, a, b));
  return { x: lerp(A.x, B.x, k), y: lerp(A.y, B.y, k) - h * Math.sin(Math.PI * span(t, a, b)), s: lerp(A.s, B.s, k) };
};
function body(t) {
  const p = t < HOP1 ? HOME : t < BACK ? hopArc(t, HOP1, HOP1 + 0.42, HOME, TR, 40) : hopArc(t, BACK, BACK + 0.5, TR, HOME, 50);
  let dy = 0, sq = 0;
  sq += 0.07 * Math.sin(Math.PI * span(t, HOP1 + 0.38, HOP1 + 0.58));
  sq += 0.08 * Math.sin(Math.PI * span(t, BACK + 0.46, BACK + 0.68));
  /* the nod on `love`, the chin up on 99 */
  dy += 6 * Math.sin(Math.PI * span(t, LOVE, LOVE + 0.45));
  dy -= 4 * smooth(span(t, BAR99, BAR99 + 0.3)) * (1 - smooth(span(t, THEN, THEN + 0.3)));
  const still = t < HOP1 - 0.05 || (t > HOP1 + 0.65 && t < BACK) || t > BACK + 0.75;
  if (still) dy += 2.2 * Math.sin(2 * Math.PI * t / 2.2);
  return { x: p.x, y: p.y + dy, s: p.s, sq };
}

/* ---------- his face ---------- */
const LENS = { w: 0 };
const AT = (x, y) => ({ x, y, w: 1 });
const LOOKS = [
  { at: 0, to: LENS },
  { at: TERRA, to: AT(270, 640) },
  { at: TLOCK + 0.3, to: LENS },
  { at: HOP1 + 0.3, to: AT(SCX, SCY + 60) },
  { at: SERVERS, to: AT(270, SCY) },
  { at: LOVE - 0.1, to: LENS },
  { at: M4.at, to: AT(SCX, SCY + 60) },
  { at: BACK + 0.5, to: LENS },
  { at: TAKE6, to: AT(270, BAR.y + 10) },
  { at: BAR99, to: LENS },
  { at: LASTED, to: AT(WIFI_TR.x, WIFI_TR.y) },
  { at: THEN, to: LENS },
];
const BLINKS = [L2.at + 0.15, L4.at + 0.1, L5.at + 0.5, L6.at + 0.05, L7.at + 0.1].map(f3);
const HAPPY = [WORLD1, LOVE + 0.05, BAR99 + 0.02];
function face(t) {
  let i = 0;
  while (i + 1 < LOOKS.length && t >= LOOKS[i + 1].at) i++;
  const p = body(t);
  const lens = { x: p.x, y: p.y, w: 0 };
  const f = o => (o.w === 0 ? lens : o);
  const cur = f(LOOKS[i].to), prev = i ? f(LOOKS[i - 1].to) : cur;
  const k = smooth(span(t, LOOKS[i].at, LOOKS[i].at + 0.22));
  const look = { x: lerp(prev.x, cur.x, k), y: lerp(prev.y, cur.y, k), w: lerp(prev.w, cur.w, k) };
  let lid = 0.04;
  for (const a of BLINKS) {
    if (t < a || t > a + 0.24) continue;
    lid = Math.max(lid, 0.84 * (t < a + 0.07 ? IO(span(t, a, a + 0.07)) : t < a + 0.10 ? 1 : 1 - smooth(span(t, a + 0.10, a + 0.24))));
  }
  /* the squint at the lens, after the wifi drops */
  lid = Math.max(lid, 0.04 + 0.42 * smooth(span(t, THEN + 0.1, THEN + 0.3)));
  let arc = 0;
  for (const h of HAPPY) arc = Math.max(arc, bump(t, h, 0.08, 0.26, 0.12));
  return { lid: f3(lid), arc: f3(arc), look, dx: f2(p.x - MAS.cx), dy: f2(p.y - MAS.cy), rot: 0, sq: f3(p.sq), s: f3(p.s) };
}

/* ---------- the letters ---------- */
const plain = (s, o = 1) => [...s].map((c, j) => ({ c, i: null, j, u: 1, o, y: 0, b: 0, g: 0 }));
const fromMorph = (P, t, at) => morphAt(P, t, at).map(l => ({ c: l.c, i: l.i, j: l.j, u: l.u, o: l.o, y: l.y, b: l.blur, g: l.born ? f3(1 - smooth(span(t, at + 0.7, at + 1.3))) : 0 }));
const fromScr = (S, o = 1) => S.map((l, j) => ({ c: l.c, i: null, j, u: 1, o: l.s === 0 ? 0 : l.s === 1 ? 0.85 * o : o, y: 0, b: 0, g: l.s === 1 ? 1 : 0 }));
const MPLAN = NAMES.map(([a, b]) => morphPlan(a, b));
/* each country's label: in on its name, the morph on the joke, out when the camera leaves */
const LABS = [
  { k: 0, in: FIN, m: FINE, out: +(CUTF - 0.2).toFixed(3) },
  { k: 1, in: FIJI + 0.04, m: WIFI - 0.05, out: M3.at },
  { k: 2, in: ICE, m: SERVER, out: M4.at },
  { k: 3, in: GREEN, m: SCREEN, out: M5.at },
];
const HI = [{ c: C_FIN, a: FIN - 0.15, b: CUTF - 0.2 }, { c: C_FIJ, a: FIJI - 0.05, b: M3.at }, { c: C_ICE, a: ICE - 0.1, b: M4.at }, { c: C_GRN, a: GREEN - 0.1, b: M5.at }, { c: C_USA, a: USA, b: M6.at + 0.3 }];

/* ---------- the map, a frame of it ---------- */
const HOMEPT = { x: HOME.x, y: HOME.y + 40 };
const R3 = v => +v.toFixed(3);
function mapState(t) {
  const s0 = cam(t), s1 = cam(t - 0.5 / 60);
  const q = toScreen(s1, { x: s0.ax, y: s0.ay });
  const mv = Math.hypot(q.x - s0.sx, q.y - s0.sy) + 300 * Math.abs(Math.log(s0.k / s1.k));
  const across = t >= CUTF && t - 0.5 / 60 < CUTF;
  const shots = (mv > 2 && !across ? shutter(t, Math.min(32, Math.ceil(mv / 1.5)), 60).map(cam) : [s0]).map(s => ({ ax: R3(s.ax), ay: R3(s.ay), sx: R3(s.sx), sy: R3(s.sy), k: +s.k.toFixed(5) }));
  const L = new Array(NC), G = new Array(NC);
  for (let c = 0; c < NC; c++) {
    const p = MAPC[c].cen;
    let lv = 1, g = 0;
    /* line 1: the map glows, one slow sweep left to right */
    const sw = rippleAt(L1.at + 0.1, { x: -60, y: p.y }, p, 340);
    lv += 0.45 * Math.sin(Math.PI * span(t, sw, sw + 0.7));
    lv += 0.9 * hitPulse(t - rippleAt(TLOCK, HOMEPT, p, 700), 0.03, 0.14);
    const gk = smooth(span(t, ...((a) => [a, a + 0.15])(rippleAt(TAKE6, HOMEPT, p, 600, 0.06, c))));
    lv += 0.55 * gk; g += 0.5 * gk;
    const dk = smooth(span(t, ...((a) => [a, a + 0.14])(rippleAt(DARK, WIFI_TR, p, DARK_V, 0.12, c + 99))));
    lv *= 1 - 0.93 * dk; g *= 1 - dk;
    for (const a of ARCS) lv *= 1 - 0.5 * hitPulse(t - a, 0.02, 0.07);
    L[c] = f3(lv); G[c] = f3(g);
  }
  let hi = -1, ha = 0;
  for (const h of HI) {
    const a = smooth(span(t, h.a, h.a + 0.25)) * (1 - smooth(span(t, h.b, h.b + 0.2)));
    if (a > 0.001) { hi = h.c; ha = f3(a); }
  }
  let tr = null;
  for (const h of HI) { const x = trace(t, h.a + 0.1, 0.95); if (x) tr = { c: h.c, ...x }; }
  const rings = [];
  if (t > TLOCK && t < TLOCK + 1.2) rings.push({ x: HOMEPT.x, y: HOMEPT.y, r: f2((t - TLOCK) * 700), a: f3(0.5 * (1 - span(t, TLOCK, TLOCK + 1.2))) });
  if (t > TAKE6 && t < TAKE6 + 1.2) rings.push({ x: HOMEPT.x, y: HOMEPT.y, r: f2((t - TAKE6) * 600), a: f3(0.45 * (1 - span(t, TAKE6, TAKE6 + 1.2))) });
  return { s: shots, L, G, hi, ha, tr, rings };
}

/* ---------- a frame of the story ---------- */
function frame(t) {
  const S = [], X = [], TX = [];
  const box = (id, o, s = 1, y = 0) => S.push([id, 'opacity', f3(o)], [id, 'transform', 'translateY(' + f2(y) + 'px) scale(' + f3(s) + ')']);
  /* the title: whole on frame 0, a punch on AI, out the top when the zoom starts */
  const tOut = CURVE56.in(span(t, HOP1 - 0.1, HOP1 + 0.15));
  const tP = 1 + 0.03 * hitPulse(t - AI);
  box('t1', 1 - tOut, tP, -30 * tOut); box('t2', 1 - tOut, tP, -30 * tOut);
  /* EARTH scrambles away on `renames`, TERRA BYTE decodes in on `terra` */
  TX.push({ id: 'earth', text: EARTH, size: 20, ls: 0.3, L: fromScr(scramble(EARTH, t, RENAME, { per: 0.05, hold: 0.12, out: true, seed: 3 }), 1) });
  S.push(['earth', 'opacity', t < RENAME + 0.5 ? 1 : 0]);
  S.push(['earth', 'transform', 'translateX(' + f2(t > RENAME && t < RENAME + 0.4 ? 4 * Math.sin(t * 90) : 0) + 'px)']);
  const tbOut = CURVE56.in(span(t, HOP1 - 0.1, HOP1 + 0.12));
  TX.push({ id: 'tb', text: TB, size: 40, ls: 0.04, L: fromScr(scramble(TB, t, TB_AT, { per: TB_PER, hold: TB_HOLD, seed: 11 })) });
  box('tb', (t >= TB_AT ? 1 : 0) * (1 - tbOut), 1 + 0.035 * hitPulse(t - TLOCK, 0.03, 0.1), -24 * tbOut);
  /* the country label */
  let lab = null;
  for (const L of LABS) if (t >= L.in - 0.01 && t < L.out + 0.25) lab = L;
  if (lab) {
    const P = MPLAN[lab.k], inn = wordIn(t, lab.in, 'rise'), o = CURVE56.in(span(t, lab.out, lab.out + 0.2));
    const morphed = t >= lab.m;
    TX.push({ id: 'lab', text: morphed ? P.to : P.from, from: morphed ? P.from : null, size: 26, ls: 0.06, L: morphed ? fromMorph(P, t, lab.m) : plain(P.from) });
    S.push(['lab', 'opacity', f3(inn.o * (1 - o))], ['lab', 'transform', 'translateY(' + f2(inn.y - 26 * o) + 'px) scale(' + f3(1 + 0.025 * hitPulse(t - lab.m - 0.45)) + ')'], ['lab', 'filter', inn.blur > 0 ? 'blur(' + inn.blur + 'px)' : 'none']);
  } else S.push(['lab', 'opacity', 0]);
  /* the usa: line one types, line two cycles and locks */
  const uOut = CURVE56.in(span(t, M6.at, M6.at + 0.2));
  if (t >= U1A && t < M6.at + 0.25) {
    const n = Math.floor(CURVE56.type(span(t, U1A, U1A + 0.5)) * U1.length + 1e-6);
    TX.push({ id: 'usa1', text: U1, size: 19, ls: 0.06, L: plain(U1).map((l, j) => ({ ...l, o: j < n ? 1 : 0 })) });
    let k = 0;
    while (k + 1 < SUF.length && t >= SUF[k + 1]) k++;
    const word = U2[k];
    let L2s;
    if (t < U2A + 0.2) { const m = Math.floor(span(t, U2A, U2A + 0.2) * 4 + 1e-6); L2s = plain('AUTO').map((l, j) => ({ ...l, o: j < m ? 1 : 0 })); }
    else L2s = fromScr(scramble(word, t, SUF[k], { per: 0.022, hold: 0.06, seed: 21 + k })).map((l, j) => (j < 4 ? { ...l, o: 1, c: 'AUTO'[j], g: 0 } : l));
    TX.push({ id: 'usa2', text: word, anchor: 'AUTOCOMPLETE', size: 30, ls: 0.04, L: L2s });
    box('usa1', 1 - uOut, 1, -20 * uOut);
    box('usa2', 1 - uOut, 1 + 0.035 * hitPulse(t - AUTOC - 0.2, 0.03, 0.1), -20 * uOut);
  } else { S.push(['usa1', 'opacity', 0], ['usa2', 'opacity', 0]); }
  /* the racks on iceland, dropped in four frames apart, squashed on landing, frost after */
  const sh = cam(t), rk = sh.k / SH.ice.k, leave = 1 - smooth(span(t, M4.at, M4.at + 0.25));
  RACK.forEach((r, i) => {
    const p = toScreen(sh, RACK_PT[i]), a = RACK_AT[i], fall = 1 - CURVE.exit(span(t, a, a + 0.18));
    const h = hitPulse(t - RACK_LAND[i]), sc = Math.min(1.4, rk);
    const o = t < a ? 0 : smooth(span(t, a, a + 0.06)) * leave;
    S.push(['rk' + i, 'opacity', f3(o)], ['rk' + i, 'transform', 'translate(' + f2(p.x - 13) + 'px,' + f2(p.y - 34 - 46 * fall * sc) + 'px) scale(' + f3(sc * (1 + 0.08 * h)) + ',' + f3(sc * (1 - 0.10 * h)) + ')']);
    S.push(['fr' + i, 'opacity', f3(smooth(span(t, RACK_LAND[i] + 0.2, RACK_LAND[i] + 0.45)))]);
    S.push(['led' + i, 'opacity', (Math.floor(t * 4 + i * 0.7) % 2) ? 1 : 0.25]);
  });
  const pp = toScreen(sh, VITI), ph = hitPulse(t - PIN_LAND), pdrop = 1 - CURVE.exit(span(t, PIN, PIN_LAND));
  const pO = t < PIN ? 0 : smooth(span(t, PIN, PIN + 0.06)) * (1 - smooth(span(t, M3.at - 0.05, M3.at + 0.08)));
  S.push(['pin', 'opacity', f3(pO)], ['pin', 'transform', 'translate(' + f2(pp.x - 11) + 'px,' + f2(pp.y - 30 - 70 * pdrop) + 'px) scale(' + f3(1 + 0.1 * ph) + ',' + f3(1 - 0.12 * ph) + ')']);
  const pr = span(t, PIN_LAND, PIN_LAND + 0.55);
  S.push(['ping', 'opacity', f3(t < PIN_LAND ? 0 : 0.9 * (1 - smooth(pr)) * pO)], ['ping', 'transform', 'translate(' + f2(pp.x - 30) + 'px,' + f2(pp.y - 12) + 'px) scale(' + f3(0.25 + 1.1 * CURVE.out(pr)) + ')']);
  /* the wifi: pops beside WI FIJI, leaves with it, flies from fiji to the corner on the pull back, loses its bars */
  let wx = 0, wy = 0, ws = 1, wo = 0;
  if (t < M3.at + 0.2) {
    const pp = (t >= WIFI_POP ? CURVE.out(span(t, WIFI_POP, WIFI_POP + 0.3)) : 0);
    wx = 392; wy = LAB_Y; ws = lerp(0.6, 1, pp); wo = smooth(span(t, WIFI_POP, WIFI_POP + 0.08)) * (1 - smooth(span(t, M3.at, M3.at + 0.2)));
  } else {
    const k = CURVE56.glide(span(t, WIFI_FLY, WIFI_FLY + 0.55));
    wx = lerp(FIJI_PT.x, WIFI_TR.x, k); wy = lerp(FIJI_PT.y, WIFI_TR.y, k) - 30 * Math.sin(Math.PI * span(t, WIFI_FLY, WIFI_FLY + 0.55)); ws = lerp(0.5, 1.45, k);
    wo = smooth(span(t, WIFI_FLY, WIFI_FLY + 0.08));
  }
  S.push(['wifi', 'opacity', f3(wo)], ['wifi', 'transform', 'translate(' + f2(wx - 20) + 'px,' + f2(wy - 17) + 'px) scale(' + f3(ws) + ')']);
  /* the arcs fill inner to outer at the pop, and drop outer to inner on the read */
  for (let a = 1; a <= 3; a++) {
    const on = t < M3.at + 0.2 ? smooth(span(t, WIFI_POP + 0.05 * a, WIFI_POP + 0.05 * a + 0.06)) : 1;
    const off = smooth(span(t, ARCS[3 - a], ARCS[3 - a] + 0.1));
    S.push(['wa' + a, 'opacity', f3(on * (1 - off))], ['wa' + a, 'transform', 'translateY(' + f2(3 * off) + 'px)']);
  }
  const dd = CURVE.exit(span(t, DROPPED, DROPPED + 0.25));
  S.push(['wdot', 'opacity', f3(1 - dd)], ['wdot', 'transform', 'translateY(' + f2(7 * dd) + 'px)']);
  /* the bar: in on `world`, fills to 99 on `ninety nine`, sticks, dims with the map */
  const bIn = t < WORLD6 ? hidden : wordIn(t, WORLD6, 'rise');
  const fill = CURVE.out(span(t, TAKE6, BAR99)) * (1 - EASE(span(t, DROPPED + 0.05, DROPPED + 0.75)));
  const bDark = smooth(span(t, ...((a) => [a, a + 0.14])(rippleAt(DARK, WIFI_TR, { x: 270, y: BAR.y + 20 }, DARK_V))));
  S.push(['bar', 'opacity', f3(bIn.o * (1 - 0.75 * bDark))], ['bar', 'transform', 'translateY(' + f2(bIn.y) + 'px) scale(' + f3(1 + 0.03 * hitPulse(t - BAR99)) + ')'], ['bar', 'filter', bIn.blur > 0 ? 'blur(' + bIn.blur + 'px)' : 'none']);
  S.push(['fill', 'width', f2(99 * fill) + '%']);
  const glitchy = ARCS.some(a => t >= a && t < a + 0.12);
  X.push(['pct', glitchy ? scramble('99', t, ARCS[0] - 1, { hold: 99, seed: 5 }).map(l => l.c).join('') + '%' : Math.round(99 * fill) + '%']);
  S.push(['cur', 'opacity', t > BAR99 + 0.3 && t < DARK ? (Math.floor((t - BAR99) * 3.5) % 2 ? 0.15 : 0.9) : 0]);
  /* the crown rides his head, and slides off when the map goes dark */
  const b = body(t), top = b.y - 118 * b.s * (1 - b.sq) / 2;
  const off = span(t, CROWN_OFF, CROWN_OFF + 0.55) ** 2;
  S.push(['gem', 'transform', 'scale(' + f3(1 + 0.9 * hitPulse(t - WORLD1, 0.04, 0.12)) + ')']);
  S.push(['crown', 'transform', 'translate(' + f2(b.x - 22 + 34 * off) + 'px,' + f2(top - 22 + 4 * b.s + 70 * off) + 'px) rotate(' + f2(-7 + 62 * off) + 'deg) scale(' + f3(b.s / 0.85) + ')'], ['crown', 'opacity', f3(1 - smooth(span(t, CROWN_OFF + 0.25, CROWN_OFF + 0.5)))]);
  return { S, X, T: TX, M: mapState(t) };
}

/* ---------- the drawing ---------- */
const GLOW = 'drop-shadow(0 0 1px #fff) drop-shadow(0 0 14px rgba(255,255,255,.65)) drop-shadow(0 0 34px rgba(255,255,255,.32))';
const GLOW_LO = 'drop-shadow(0 0 1px #fff) drop-shadow(0 0 9px rgba(255,255,255,.45)) drop-shadow(0 0 22px rgba(255,255,255,.22))';
const GREEN_GLOW = 'drop-shadow(0 0 1px var(--accent)) drop-shadow(0 0 10px rgba(80,255,140,.5)) drop-shadow(0 0 24px rgba(80,255,140,.24))';
const css = `
#map{position:absolute;left:0;top:0;width:540px;height:960px}
.big{position:absolute;left:0;right:0;height:0;display:flex;justify-content:center;will-change:transform,opacity}
.big b{display:block;font:400 30px/1 var(--display);color:#f7f9f8;letter-spacing:.04em;white-space:nowrap;-webkit-text-stroke:1px #fff;filter:${GLOW};transform:translateY(-50%)}
.tx{position:absolute;left:0;width:540px;height:0;transform-origin:270px 0;will-change:transform,opacity}
.tx .in{position:absolute;left:270px;top:0;transform:translate(-50%,-50%);font-family:var(--display);font-weight:400;white-space:nowrap;line-height:1}
.tx .in s{text-decoration:none;visibility:hidden}
.tx .in i{position:absolute;left:50%;top:50%;font-style:normal;color:#f7f9f8;will-change:transform}
#earth .in{font-size:20px;letter-spacing:.3em;filter:${GLOW_LO}}
#earth .in i{color:rgba(233,238,236,.82)}
#tb .in{font-size:40px;letter-spacing:.04em;filter:${GLOW}}
#tb .in i{-webkit-text-stroke:1px #fff}
/* a dark plate under each label, outside the glow, so the map lines never cut through the words */
.tx::before{content:'';position:absolute;left:270px;top:0;width:var(--pw,380px);height:var(--ph,70px);transform:translate(-50%,-50%);background:radial-gradient(closest-side,rgba(6,7,10,.9),rgba(6,7,10,.65) 55%,rgba(6,7,10,0))}
#earth{--pw:240px;--ph:56px}
#tb{--pw:470px;--ph:84px}
#lab{--pw:470px;--ph:72px}
#usa1{--pw:420px;--ph:56px}
#usa2{--pw:470px;--ph:72px}
#bar::before{content:'';position:absolute;left:-40px;right:-40px;top:-22px;bottom:-22px;z-index:-1;background:radial-gradient(closest-side,rgba(6,7,10,.9),rgba(6,7,10,.6) 60%,rgba(6,7,10,0))}
#lab .in{font-size:26px;letter-spacing:.06em;filter:${GLOW_LO}}
#usa1 .in{font-size:19px;letter-spacing:.06em;filter:${GLOW_LO}}
#usa2 .in{font-size:30px;letter-spacing:.04em;filter:${GLOW}}
.rack{position:absolute;left:0;top:0;width:26px;height:34px;transform-origin:13px 34px;opacity:0;will-change:transform,opacity}
.rack svg{width:26px;height:34px;overflow:visible;filter:${GLOW_LO}}
#wifi{position:absolute;left:0;top:0;width:40px;height:34px;transform-origin:20px 17px;opacity:0;will-change:transform,opacity}
#wifi svg{position:absolute;left:0;top:0;width:40px;height:34px;overflow:visible;filter:${GREEN_GLOW}}
/* the dark copy under the green one: a dropped bar is this, unlit, no glow */
#wifi svg.wg{filter:none}
#wifi svg.wg path{stroke:#23272a}
#wifi svg.wg circle{fill:#23272a}
#bar{position:absolute;left:${BAR.l}px;width:${BAR.r - BAR.l}px;top:${BAR.y - 16}px;opacity:0;transform-origin:50% 50%;will-change:transform,opacity}
#bar .row{display:flex;justify-content:space-between;align-items:baseline;font:400 15px/1 var(--display);color:#f7f9f8;letter-spacing:.1em;filter:${GLOW_LO}}
#pct{font-size:22px;color:var(--accent);filter:${GREEN_GLOW}}
#trk{position:relative;margin-top:12px;height:14px;border:2px solid #e9eeec;border-radius:4px;filter:${GLOW_LO}}
#fill{position:absolute;left:2px;top:2px;bottom:2px;width:0;border-radius:2px;background:var(--accent);max-width:calc(100% - 4px)}
#cur{position:absolute;right:2px;top:2px;bottom:2px;width:calc(1% + 1px);background:#e9eeec;opacity:0}
#pin{position:absolute;left:0;top:0;width:22px;height:30px;transform-origin:11px 30px;opacity:0;will-change:transform,opacity}
#pin svg{width:22px;height:30px;overflow:visible;filter:${GREEN_GLOW}}
#ping{position:absolute;left:0;top:0;width:60px;height:24px;border:2px solid var(--accent);border-radius:50%;opacity:0;transform-origin:30px 12px;filter:${GREEN_GLOW};will-change:transform,opacity}
#crown{position:absolute;left:0;top:0;width:44px;height:26px;transform-origin:22px 26px;z-index:7;will-change:transform,opacity}
#crown svg{width:44px;height:26px;overflow:visible;filter:${GLOW_LO}}
`;
const rack = i => `<div class="rack" id="rk${i}"><svg viewBox="0 0 26 34">
  <rect x="1.2" y="1.2" width="23.6" height="31.6" rx="3" style="fill:#06070a;stroke:#e9eeec;stroke-width:2"/>
  <path d="M5 10 H21 M5 17 H21 M5 24 H21" style="stroke:rgba(233,238,236,.55);stroke-width:1.6;stroke-linecap:round"/>
  <circle id="led${i}" cx="19.5" cy="28.5" r="1.7" style="fill:var(--accent)"/>
  <g id="fr${i}" style="opacity:0;stroke:#f2fbff;stroke-width:1.1;stroke-linecap:round">
    <path d="M2 1.2 H24" style="stroke-width:2.2;stroke:rgba(235,248,255,.9)"/>
    <path d="M6 -4 V2 M3.4 -2.5 L8.6 0.5 M3.4 0.5 L8.6 -2.5"/>
    <path d="M18 -6 V0 M15.4 -4.5 L20.6 -1.5 M15.4 -1.5 L20.6 -4.5"/>
  </g>
</svg></div>`;
const tx = (id, y, ghost) => `<div class="tx" id="${id}" style="top:${y}px"><div class="in"><s>${ghost}</s></div></div>`;
const markup = `
<canvas id="map" width="1080" height="1920"></canvas>
<div class="big" id="t1" style="top:${TY.t1}px"><b>${T1}</b></div>
<div class="big" id="t2" style="top:${TY.t2}px"><b>${T2}</b></div>
${tx('earth', 640, EARTH)}
${tx('tb', 640, TB)}
${tx('lab', LAB_Y, 'FINE TUNED LAND')}
${tx('usa1', 636, U1)}
${tx('usa2', 680, 'AUTOCOMPLETE')}
<div id="ping"></div>
<div id="pin"><svg viewBox="0 0 22 30"><path d="M11 29 C11 29 2 17 2 11 A9 9 0 0 1 20 11 C20 17 11 29 11 29 Z" style="fill:#06070a;stroke:var(--accent);stroke-width:2.4;stroke-linejoin:round"/><circle cx="11" cy="11" r="3.4" style="fill:var(--accent)"/></svg></div>
${RACK.map((r, i) => rack(i)).join('')}
<div id="bar"><div class="row"><span>${WT}</span><span id="pct">0%</span></div><div id="trk"><div id="fill"></div><div id="cur"></div></div></div>`;
const front = `
<div id="wifi"><svg class="wg" viewBox="0 0 40 34">
  <path d="M3 13 A24 24 0 0 1 37 13" style="fill:none;stroke-width:3;stroke-linecap:round"/>
  <path d="M9 19.5 A15 15 0 0 1 31 19.5" style="fill:none;stroke-width:3;stroke-linecap:round"/>
  <path d="M14.5 25.5 A7.5 7.5 0 0 1 25.5 25.5" style="fill:none;stroke-width:3;stroke-linecap:round"/>
  <circle cx="20" cy="31" r="2.6"/>
</svg><svg viewBox="0 0 40 34">
  <path id="wa3" d="M3 13 A24 24 0 0 1 37 13" style="fill:none;stroke:var(--accent);stroke-width:3;stroke-linecap:round"/>
  <path id="wa2" d="M9 19.5 A15 15 0 0 1 31 19.5" style="fill:none;stroke:var(--accent);stroke-width:3;stroke-linecap:round"/>
  <path id="wa1" d="M14.5 25.5 A7.5 7.5 0 0 1 25.5 25.5" style="fill:none;stroke:var(--accent);stroke-width:3;stroke-linecap:round"/>
  <circle id="wdot" cx="20" cy="31" r="2.6" style="fill:var(--accent)"/>
</svg></div>
<div id="crown"><svg viewBox="0 0 44 26">
  <path d="M5 23 L3 6 L13.5 13.5 L22 2 L30.5 13.5 L41 6 L39 23 Z" style="fill:#06070a;stroke:#e9eeec;stroke-width:2.4;stroke-linejoin:round"/>
  <circle id="gem" cx="22" cy="17.5" r="2.4" style="fill:var(--accent);transform-origin:22px 17.5px"/>
</svg></div>`;

function page() {
  const D = window.__GAGD, els = {}, last = {};
  const $ = id => els[id] || (els[id] = document.getElementById(id));
  const cv = $('map'), ctx = cv.getContext('2d');
  const acc = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
  const pc = document.createElement('canvas').getContext('2d');
  pc.fillStyle = acc || '#3dff8a'; pc.fillRect(0, 0, 1, 1);
  const AC = Array.from(pc.getImageData(0, 0, 1, 1).data.slice(0, 3));
  const WH = [233, 238, 236];
  const rgb = (g, a) => 'rgba(' + [0, 1, 2].map(i => Math.round(WH[i] + (AC[i] - WH[i]) * g)).join(',') + ',' + a.toFixed(4) + ')';
  /* the outlines as paths in map space, built once */
  const path = f => { const p = new Path2D(); p.moveTo(f[0], f[1]); for (let i = 2; i < f.length; i += 2) p.lineTo(f[i], f[i + 1]); return p; };
  const CO = D.c.map(c => { const p = new Path2D(); for (const f of c.co) p.addPath(path(f)); return p; });
  const BO = D.c.map(c => c.bo.map(([o, f]) => [o, path(f)]));
  const TRC = {};
  for (const k in D.tr) { const f = D.tr[k], cum = [0]; for (let i = 2; i < f.length; i += 2) cum.push(cum[cum.length - 1] + Math.hypot(f[i] - f[i - 2], f[i + 1] - f[i - 1])); TRC[k] = { f, cum }; }
  function drawMap(m) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    /* the dot grid, the ripple a brighter ring through it */
    for (let y = 8; y < 960; y += 16) for (let x = 6; x < 540; x += 16) {
      let b = 0;
      for (const r of m.rings) { const d = Math.hypot(x - r.x, y - r.y) - r.r; b += r.a * Math.exp(-(d * d) / 450); }
      ctx.fillStyle = rgb(Math.min(1, b * 2), 0.075 + b);
      ctx.fillRect(x - 0.8, y - 0.8, 1.6, 1.6);
    }
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const n = m.s.length, wt = 1 / n;
    for (const s of m.s) {
      ctx.setTransform(2 * s.k, 0, 0, 2 * s.k, 2 * (s.sx - s.ax * s.k), 2 * (s.sy - s.ay * s.k));
      for (let c = 0; c < D.c.length; c++) {
        const b = D.c[c].b;
        if (s.sx + (b[2] - s.ax) * s.k < -10 || s.sx + (b[0] - s.ax) * s.k > 550 || s.sy + (b[3] - s.ay) * s.k < -10 || s.sy + (b[1] - s.ay) * s.k > 970) continue;
        const lv = m.L[c], g = m.G[c];
        for (const [o, p] of BO[c]) {
          const lb = Math.max(lv, m.L[o]);
          ctx.strokeStyle = rgb(Math.max(g, m.G[o]), Math.min(1, 0.15 * lb) * wt); ctx.lineWidth = 0.75 / s.k; ctx.stroke(p);
        }
        ctx.strokeStyle = rgb(g, Math.min(1, 0.11 * lv) * wt); ctx.lineWidth = 3.6 / s.k; ctx.stroke(CO[c]);
        ctx.strokeStyle = rgb(g, Math.min(1, 0.8 * lv) * wt); ctx.lineWidth = 1.05 / s.k; ctx.stroke(CO[c]);
        if (c === m.hi) {
          ctx.strokeStyle = rgb(1, 0.2 * m.ha * wt); ctx.lineWidth = 6 / s.k; ctx.stroke(CO[c]);
          ctx.strokeStyle = rgb(1, 0.85 * m.ha * wt); ctx.lineWidth = 1.5 / s.k; ctx.stroke(CO[c]);
          for (const [, p] of BO[c]) ctx.stroke(p);
          for (let o = 0; o < BO.length; o++) for (const [q, p] of BO[o]) if (q === c) ctx.stroke(p);
        }
      }
    }
    /* the comet: a short green dash once round the country, brighter at its head */
    if (m.tr && TRC[m.tr.c]) {
      const s = m.s[m.s.length - 1], T = TRC[m.tr.c], L = T.cum[T.cum.length - 1];
      ctx.setTransform(2 * s.k, 0, 0, 2 * s.k, 2 * (s.sx - s.ax * s.k), 2 * (s.sy - s.ay * s.k));
      const a = m.tr.a * L, b = m.tr.b * L, N = 14;
      for (let q = 0; q < N; q++) {
        const u0 = a + (b - a) * q / N, u1 = a + (b - a) * (q + 1) / N, k = (q + 1) / N;
        ctx.beginPath();
        let started = false;
        for (let i = 1; i < T.cum.length; i++) {
          if (T.cum[i] < u0 || T.cum[i - 1] > u1) continue;
          const x = T.f[2 * i - 2], y = T.f[2 * i - 1];
          if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
          ctx.lineTo(T.f[2 * i], T.f[2 * i + 1]);
        }
        ctx.strokeStyle = rgb(1, 0.25 * k * m.tr.o); ctx.lineWidth = 8 / s.k; ctx.stroke();
        ctx.strokeStyle = rgb(0.6, 0.95 * k * m.tr.o); ctx.lineWidth = 2.4 / s.k; ctx.stroke();
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  /* the letters: laid out once per string with the display face, each letter
     placed by the frame's numbers */
  const mc = document.createElement('canvas').getContext('2d'), lays = {};
  function lay(str, size, ls) {
    const key = str + '|' + size + '|' + ls;
    if (lays[key]) return lays[key];
    mc.font = '400 ' + size + 'px Michroma';
    const xs = []; let x = 0;
    for (const ch of str) { xs.push(x); x += mc.measureText(ch).width + ls * size; }
    const W = x - ls * size;
    return (lays[key] = xs.map(v => v - W / 2));
  }
  function text(e) {
    const inn = $(e.id).firstElementChild, ghost = inn.firstElementChild;
    const gtxt = e.anchor || e.text;
    if (ghost.textContent !== gtxt) ghost.textContent = gtxt;
    let XT = lay(e.text, e.size, e.ls);
    if (e.anchor) { const A = lay(e.anchor, e.size, e.ls); XT = XT.map(v => v - XT[0] + A[0]); }
    const XF = e.from ? lay(e.from, e.size, e.ls) : null;
    while (inn.children.length - 1 < e.L.length) inn.appendChild(document.createElement('i'));
    for (let k = 1; k < inn.children.length; k++) {
      const sp = inn.children[k], l = e.L[k - 1];
      if (!l) { sp.style.display = 'none'; continue; }
      sp.style.display = '';
      const x = l.i == null ? XT[l.j] : l.j == null ? XF[l.i] : XF[l.i] + (XT[l.j] - XF[l.i]) * l.u;
      if (sp.textContent !== l.c) sp.textContent = l.c;
      sp.style.transform = 'translate(' + x.toFixed(2) + 'px,' + (l.y - 0.5).toFixed(3) + 'em)';
      sp.style.opacity = l.o;
      sp.style.filter = l.b > 0 ? 'blur(' + l.b + 'px)' : 'none';
      sp.style.color = l.g > 0 ? 'color-mix(in srgb, var(--accent) ' + Math.round(l.g * 100) + '%, #f7f9f8)' : '';
    }
  }
  window.__gag = {
    apply(o) {
      for (const [id, k, v] of o.S) { const key = id + '#' + k; if (last[key] !== v) { last[key] = v; $(id).style[k] = v; } }
      for (const [id, v] of o.X) if ($(id).textContent !== v) $(id).textContent = v;
      for (const e of o.T) text(e);
      drawMap(o.M);
    },
  };
}

/* ---------- the sound: on contact or on the fastest frame, nothing in the hush ---------- */
const CUES = [
  { t: RENAME + 0.02, kind: 'glitch', from: 'EARTH scrambles away' },
  { t: TLOCK, kind: 'popDeep', from: 'TERRA BYTE locks, the map pulses' },
  { t: peakAt(M1.at, M1.at + M1.d, M1.curve), kind: 'whooshUp', opts: { len: 0.34 }, from: 'the zoom to finland, fastest frame' },
  { t: CUTF - 0.12, kind: 'whoosh', opts: { len: 0.3 }, from: 'the cut to fiji, on the cut' },
  { t: PIN_LAND, kind: 'ding', opts: { f: 1320, tau: 0.05, len: 0.2 }, from: 'the pin lands, a short ping' },
  { t: WIFI_POP + 0.02, kind: 'pop', from: 'the wifi pops' },
  { t: RACK_LAND[0], kind: 'land', from: 'the first rack lands' },
  { t: peakAt(M5.at, M5.at + M5.d, M5.curve) - 0.12, kind: 'whoosh', opts: { len: 0.28 }, from: 'the whip to the usa, fastest frame' },
  { t: AUTOC + 0.2, kind: 'popDeep', from: 'AUTOCOMPLETE locks' },
  { t: peakAt(M6.at, M6.at + M6.d, M6.curve) - 0.15, kind: 'whooshUp', opts: { len: 0.4 }, from: 'the pull back, fastest frame' },
  { t: BAR99, kind: 'ding', from: 'the bar hits 99' },
  ...ARCS.map((a, i) => ({ t: a + 0.02, kind: 'tock', opts: { f: 1700 - 300 * i }, from: 'a wifi bar drops' })),
  { t: DARK, kind: 'hum', opts: { len: 1.0, f: 58, rise: 0.02, fall: 0.8 }, from: 'the map powers down' },
  { t: CUT - 0.09, kind: 'zap', from: 'glitch' },
  { t: CUT, kind: 'bass', opts: { len: +(HOLD - 0.02).toFixed(3) }, from: 'the end card' },
].map(c => ({ ...c, t: +c.t.toFixed(4) }));
for (const c of CUES) if (c.t > L6.end - 0.05 && c.t < L7.at - 0.03) throw new Error('an effect in the silence: ' + c.from);

const BEATS = [AI, RENAME, TLOCK, M1.at, FINE, CUTF, PIN_LAND, WIFI_POP, M3.at, SERVER, SERVERS, LOVE, M4.at, SCREEN, M5.at, U1A, AUTOC, M6.at, TAKE6, BAR99, LASTED, FOUR, SECONDS, DROPPED, CROWN_OFF];
const STILLS = [0, AI + 0.15, RENAME + 0.15, TLOCK + 0.12, M1.at + 0.4, FIN + 0.5, FINE + 0.6, CUTF + 0.1, PIN_LAND + 0.15, WIFI_POP + 0.4, M3.at + 0.4, SERVER + 0.6, RACK_LAND[4] + 0.5,
  LOVE + 0.15, M4.at + 0.7, SCREEN + 0.6, M5.at + 0.3, SUF[1] + 0.1, AUTOC + 0.4, M6.at + 0.5, TAKE6 + 0.5, BAR99 + 0.2, L6.end + 0.3, FOUR + 0.3, DROPPED + 0.5, CROWN_OFF + 0.35, CUT + 0.6].map(f3);

await runEpisode({
  post: 56, ep: 0, series: false, title: [],
  cut: CUT, hold: HOLD,
  mascot: MAS,
  voice: TAKES, subs: SUBS, subsAt0: true,
  tp: -1,
  sfx: { cues: CUES, level: -9, duck: 0.6, gains: { whoosh: -21, whooshUp: -21, popDeep: -15, bass: -20, hum: -14, tock: -20 } },
  stills: process.argv.includes('--stills') ? STILLS : null,
  gag: {
    css, markup, front, page, frame, face, camera,
    data: GDATA,
    sleep: [],
    beats: BEATS,
    checks: ['#t1 b', '#t2 b', '#earth .in', '#tb .in', '#lab .in', '#usa1 .in', '#usa2 .in', '#bar', '#wifi', '#crown', '#pin'],
    hook: ['#t1 b', '#t2 b', '#map', '#crown', '#earth .in'],
    copy: [T1, T2, EARTH, TB, ...NAMES.flat(), U1, ...U2, WT, '99%'],
    verify: [
      { at: TLOCK + 0.3, sel: '#tb .in', test: r => (r && r.l >= 60 && r.r <= 480 ? null : 'TERRA BYTE leaves the margin: ' + JSON.stringify(r)) },
      { at: FINE + 0.8, sel: '#lab .in', test: r => (r && r.l >= 60 && r.r <= 480 ? null : 'FINE TUNED LAND leaves the margin: ' + JSON.stringify(r)) },
      { at: AUTOC + 0.4, sel: '#usa2 .in', test: r => (r && r.l >= 60 && r.r <= 480 ? null : 'AUTOCOMPLETE leaves the margin: ' + JSON.stringify(r)) },
      { at: 0.1, sel: '#crown', test: r => (r && r.t >= 60 ? null : 'the crown is off its spot: ' + JSON.stringify(r)) },
    ],
    log: [[L1.at, 'line 1'], [AI, 'the title punches'], [RENAME, 'EARTH scrambles'], [TLOCK, 'TERRA BYTE locks, the pulse'], [M1.at, 'zoom to finland'], [FINE, 'FINE TUNED LAND'],
      [CUTF, 'cut to fiji'], [PIN_LAND, 'the pin lands'], [WIFI_POP, 'WI FIJI, the wifi'], [M3.at, 'hop to iceland'], [SERVER, 'SERVER LAND'], [SERVERS, 'the racks'], [LOVE, 'the nod'], [M4.at, 'glide to greenland'],
      [SCREEN, 'SCREENLAND'], [M5.at, 'whip to the usa'], [U1A, 'UNITED STATES OF'], [AUTOC, 'AUTOCOMPLETE locks'], [M6.at, 'the pull back'], [TAKE6, 'every country glows'],
      [BAR99, '99%'], [L6.end, 'the hush'], [LASTED, 'a bar drops'], [DROPPED, 'the map goes dark'], [CROWN_OFF, 'the crown slides off']],
  },
});
