/* the boring tek — post59. AI takes over the world, round two.

   dark, 1080x1920. seven lines on the elevenlabs narrator, eleven_v4, three
   takes a line kept by measurement, every take sped up 1.12 with atempo, pitch
   kept. post58's subtitles, the plain end card. post56's map and kit: the
   anchor camera with log space zoom, chained moves, shutter blur on the map,
   hitPulse, ripples, the letter morph and the comet trace.

     frame 0  the glowing world map, him on top of it with the crown, AI TAKES
              OVER THE WORLD, a small ROUND 2 tag
     l1       AI is taking ...        a ripple from him, the title punches on AI,
                                      ROUND 2 slams on round
     l2       england first ...       zoom to london, he hops off, big ben rises,
                                      its clock face becomes a brain, BIG BRAIN
     l3       australia ...           whip to australia, DOWNLOAD UNDER, a bar
                                      fills across the continent
     l4       then dubai ...          whip to the emirates, the skyline rises,
                                      DUBAI splits into DUB AI, AI goes green, he
                                      pops in top right and nods, a tick lands
     l5       china ...               glide to china, the great wall draws on,
                                      tiny text scrolls along it, OF TEXT
     l6       takeover almost done    pull back, he hops home, the four glow
                                      green, TAKEOVER to 99%
     silence                          the bar sits at 99
     l7       but the planet ...      UPDATE REQUIRED slams in, the EARTH cursor
                                      clicks REMIND ME TOMORROW, the popup shuts,
                                      the bar drops, the crown slides off, he
                                      squints at the lens
     the glitch cut, the plain end card

   the map is natural earth 50m admin 0, public domain, in demo/assets and
   gitignored, the same equal earth projection as post56. the landmarks are
   line art drawn here, no photos, no logos, no flags. green only as accents.

     DEMO_FPS=12 node post59.mjs          the preview
     node post59.mjs --stills             one still per beat, no render
     node post59.mjs                      60fps
*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runEpisode, readLines, place, wAt, span, lerp, smooth, bump, EASE, IO, SPRING,
  livingCamera, wordIn, CURVE, CURVE56, peakAt, toScreen, shotChain, shutter,
  hitPulse, rippleAt, morphPlan, morphAt, trace,
} from './lib/aiafter.mjs';

/* ---------- the read ---------- */
const MODEL = { model: 'eleven_v4' };
const TEMPO = 1.16;
const LINES = [
  { key: 'r1', text: '[excited] AI is taking over the world again. round two.', tempo: TEMPO, take: 1 },
  { key: 'r2', text: '[cheerful] england first. big ben is now big brain.', tempo: TEMPO },
  { key: 'r3', text: '[playful] australia, down under? now it is download under.', tempo: TEMPO },
  { key: 'r4', text: '[amused] dubai? wait... dub AI. already done.', tempo: TEMPO },
  { key: 'r5', text: '[cheerful] china. the great wall is now the great wall of text.', tempo: TEMPO },
  { key: 'r6', text: '[excited] takeover almost done.', tempo: TEMPO, take: 2 },
  { key: 'r7', text: '[amused] but the planet clicked, remind me tomorrow.', tempo: TEMPO, take: 1 },
];
/* pinned by speech to text at 1.16: line one's t2 and t3 come back as hey i,
   line six's t1 as hake over, line seven's t2 and t3 drop the but */
const TAKES = await readLines(59, LINES, 3, MODEL);
const [L1, L2, L3, L4, L5, L6, L7] = TAKES;
/* past 24s, so the gaps round dubai and china go to the rig's floor first */
const GAP = 0.3, TIGHT = 0.25, HUSH = 0.5;
place(L1, 0.30);
for (let i = 1; i < TAKES.length; i++) place(TAKES[i], TAKES[i - 1].end + (i === 6 ? HUSH : i >= 3 ? TIGHT : GAP));
const SUBS = [
  { line: 0, text: 'AI is taking over the world again' },
  { line: 0, text: 'round two' },
  { line: 1, text: 'england first' },
  { line: 1, text: 'big ben is now big brain' },
  { line: 2, text: 'australia, down under?' },
  { line: 2, text: 'now it is download under' },
  { line: 3, text: 'dubai? wait' },
  { line: 3, text: 'dub AI' },
  { line: 3, text: 'already done' },
  { line: 4, text: 'china' },
  { line: 4, text: 'the great wall is now' },
  { line: 4, text: 'the great wall of text' },
  { line: 5, text: 'takeover almost done' },
  { line: 6, text: 'but the planet clicked' },
  { line: 6, text: 'remind me tomorrow' },
];

/* ---------- the map: natural earth, equal earth, in stage css px. post56's ---------- */
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
const PT = (lon, lat) => { const [x, y] = P(lon, lat); return { x, y }; };

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
/* douglas peucker. a closed ring is split in two first */
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
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, main = null, mainA = -1;
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
  }
  return {
    name: c.name, b: [x0, y0, x1, y1].map(v => +v.toFixed(2)), cen: { x: (x0 + x1) / 2, y: (y0 + y1) / 2 },
    co: co.map(r => flat(simplify(r.pts, TOL))), bo: bo.map(r => [r.other, flat(simplify(r.pts, TOL))]),
    main,
  };
});
const idx = n => { const i = MAPC.findIndex(c => c.name === n); if (i < 0) throw new Error('no ' + n + ' in natural earth'); return i; };
const C_UK = idx('United Kingdom'), C_AUS = idx('Australia'), C_UAE = idx('United Arab Emirates'), C_CHN = idx('China');
const FOUR = [C_UK, C_AUS, C_UAE, C_CHN];
const SCX = 270, SCY = 468, BOXW = 330, BOXH = 250;
function shotOf(ci) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [x, y] of MAPC[ci].main) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return { ax: (x0 + x1) / 2, ay: (y0 + y1) / 2, sx: SCX, sy: SCY, k: Math.min(BOXW / (x1 - x0), BOXH / (y1 - y0), 60) };
}
const FULL = { ax: 270, ay: 480, sx: 270, sy: 480, k: 1 };
/* the landmarks' feet on the map */
const LONDON = PT(-0.13, 51.5), DUBAI = PT(55.27, 25.2), WALLPT = PT(114.5, 40.6);
const AUSC = { x: shotOf(C_AUS).ax, y: shotOf(C_AUS).ay };
const SH = {
  uk: { ax: LONDON.x, ay: LONDON.y, sx: 290, sy: 560, k: 18 },
  aus: shotOf(C_AUS),
  uae: { ax: DUBAI.x, ay: DUBAI.y, sx: 270, sy: 545, k: 30 },
  chn: { ax: WALLPT.x, ay: WALLPT.y, sx: 270, sy: 500, k: 4.4 },
};
const TRACE = Object.fromEntries(FOUR.map(c => [c, flat(simplify([...MAPC[c].main, MAPC[c].main[0]], TOL))]));
const GDATA = { c: MAPC.map(c => ({ b: c.b, co: c.co, bo: c.bo })), tr: TRACE };
const NC = MAPC.length;

/* ---------- the words on screen ---------- */
const T1 = 'AI TAKES OVER', T2 = 'THE WORLD', R2 = 'ROUND 2';
const NAMES = [['BIG BEN', 'BIG BRAIN'], ['DOWN UNDER', 'DOWNLOAD UNDER'], ['DUBAI', 'DUB AI'], ['THE GREAT WALL', 'THE GREAT WALL']];
const OFTEXT = 'OF TEXT', WT = 'TAKEOVER';
const POP_H1 = 'UPDATE REQUIRED', POP_H2 = 'TO FINISH TAKEOVER', BTN_UP = 'UPDATE NOW', BTN_RM = 'REMIND ME TOMORROW', CUR_TAG = 'EARTH';
/* the wall of text: dry, about the AI, never about anyone */
const WALLTXT = ('as an AI model i would like to add a short note before the summary of the summary. '
  + 'first, a recap of the recap. second, a list of five lists. third, a gentle reminder that this reply could be shorter. '
  + 'it will not be. in conclusion, here is the conclusion, followed by a longer conclusion and a short appendix of appendices. ').repeat(2);

/* ---------- the layout, css px of the 540x960 stage ---------- */
const MAS = { cx: 270, cy: 330, size: 118, scale: 0.85 };
const HOME = { x: 270, y: 330, s: 0.85 }, TR = { x: 440, y: 168, s: 0.51 }, AWAY = { x: 270, y: 176, s: 0.42 };
const TY = { r2: 122, t1: 170, t2: 214 }, LAB_Y = 650, LAB2_Y = 692, BAR = { y: 652, l: 90, r: 450 };
const POP = { cx: 270, cy: 492, w: 370 };

/* ---------- the beats, all off the read ---------- */
const f2 = v => +v.toFixed(2), f3 = v => +v.toFixed(3);
const w = (T, x, after) => f3(wAt(T, x, after) - 0.04);
const wi = (T, x) => T.W.findIndex(q => q.word.toLowerCase().replace(/[^a-z0-9]/g, '') === x);
const AI = w(L1, 'ai'), TAKING = w(L1, 'taking'), WORLD1 = w(L1, 'world'), ROUND = w(L1, 'round');
const RIP = 0.12;
/* the big sweep, left to right across the map, starting on taking or by 0.6s */
const SWEEP = f3(Math.min(TAKING, 0.6)), SWEEP_V = 360;
const ENGLAND = w(L2, 'england'), BEN = w(L2, 'big'), BRAIN = w(L2, 'brain');
const AUS = w(L3, 'australia'), DOWN = w(L3, 'down'), DOWNLOAD = w(L3, 'download');
const DUBAIW = w(L4, 'dubai'), WAIT = w(L4, 'wait'), DUB = w(L4, 'dub'), AI4 = w(L4, 'ai'), ALREADY = w(L4, 'already'), DONE4 = w(L4, 'done');
const AI2 = DONE4;
const CHINA = w(L5, 'china'), GREAT = w(L5, 'great'), OF = w(L5, 'of'), TEXTW = w(L5, 'text');
const TAKE6 = w(L6, 'takeover'), DONE = w(L6, 'done');
const CLICKED = w(L7, 'clicked'), REMIND = w(L7, 'remind'), TOMORROW = w(L7, 'tomorrow');

/* the camera chain: each move starts from wherever the last one is */
const M1 = { at: f3(ENGLAND - 0.35), d: 0.8, to: SH.uk, curve: CURVE.cam };
/* each move leaves after its line's payoff, in the gap, so the joke holds */
const M2 = { at: f3(L2.end + 0.12), d: 0.85, to: SH.aus, curve: CURVE56.whip, hop: 2.0 };
const M3 = { at: f3(L3.end + 0.08), d: 0.8, to: SH.uae, curve: CURVE56.whip, hop: 1.4 };
const M4 = { at: f3(L4.end + 0.08), d: 0.7, to: SH.chn, curve: CURVE56.glide, hop: 0.6 };
const M5 = { at: f3(L5.end + 0.15), d: 1.0, to: FULL, curve: CURVE56.pull };
const cam = shotChain(FULL, [M1, M2, M3, M4, M5]);
const HOPOFF = f3(M1.at + 0.05), POPIN = f3(ALREADY - 0.12), BACK = f3(M5.at + 0.2);
const BAR99 = f3(DONE + 0.25);
/* the popup slams on the end of the silence, the cursor clicks on remind */
const SLAM = f3(L7.at - 0.03), CUR_IN = f3(L7.at + 0.15), CLICK = f3(REMIND), SHUT = f3(CLICK + 0.22), DROP = f3(SHUT + 0.08), CROWN_OFF = f3(DROP + 0.12);
const TURN = f3(Math.max(TOMORROW + 0.15, DROP + 0.45)), SQUINT = f3(TURN + 0.15);
const CUT = f3(Math.max(L7.end + 0.25, SQUINT + 0.25 + 0.5));
const HOLD = 1.0;
/* the landmarks */
const BB_IN = f3(M1.at + M1.d - 0.12), BB_D = 0.6, MORPH_BB = f3(BRAIN - 0.05);
const BAR_IN = f3(w(L3, 'now') - 0.05), FILL0 = f3(DOWNLOAD), FILL1 = f3(DOWNLOAD + 1.0);
const SKY_IN = f3(Math.max(DUBAIW - 0.05, M3.at + M3.d - 0.12)), SKY_D = 0.6, AI_GLOW = f3(AI4 + 0.12), TICK = f3(DONE4);
const WALL_IN = f3(Math.max(GREAT - 0.1, M4.at + M4.d - 0.12)), WALL_D = 0.7, SCROLL0 = f3(WALL_IN + WALL_D - 0.1);

const hidden = { o: 0, s: 1, y: 0, blur: 0 };

/* ---------- the camera on the whole stage, the living push ---------- */
const camera = livingCamera({
  F: { x: 270, y: 470 },
  holds: [[0, M1.at - 0.15], [L6.end, CUT]],
  push: 0.03,
  punches: [MORPH_BB + 0.35, WAIT, BAR99],
});

/* ---------- where he is ---------- */
const hopArc = (t, a, b, A, B, h) => {
  const k = EASE(span(t, a, b));
  return { x: lerp(A.x, B.x, k), y: lerp(A.y, B.y, k) - h * Math.sin(Math.PI * span(t, a, b)), s: lerp(A.s, B.s, k) };
};
/* off on the zoom to london, a pop into the corner at dubai, home on the pull back */
function body(t) {
  let p, vis = 1;
  if (t < HOPOFF) p = HOME;
  else if (t < POPIN) { p = hopArc(t, HOPOFF, HOPOFF + 0.42, HOME, AWAY, 40); vis = 1 - smooth(span(t, HOPOFF + 0.18, HOPOFF + 0.4)); }
  else if (t < BACK) { p = { ...TR, s: TR.s * lerp(0.2, 1, SPRING(span(t, POPIN, POPIN + 0.4))) }; vis = smooth(span(t, POPIN, POPIN + 0.08)); }
  else p = hopArc(t, BACK, BACK + 0.5, TR, HOME, 50);
  let dy = 0, sq = 0;
  sq += 0.07 * Math.sin(Math.PI * span(t, HOPOFF - 0.08, HOPOFF + 0.06));
  sq += 0.08 * Math.sin(Math.PI * span(t, BACK + 0.46, BACK + 0.68));
  /* the nod on the second AI, the chin up on 99 */
  dy += 5 * Math.sin(Math.PI * span(t, AI2, AI2 + 0.42));
  dy -= 4 * smooth(span(t, BAR99, BAR99 + 0.3)) * (1 - smooth(span(t, SLAM, SLAM + 0.3)));
  const still = t < HOPOFF - 0.1 || (t > POPIN + 0.45 && t < BACK) || t > BACK + 0.75;
  if (still) dy += 2.2 * Math.sin(2 * Math.PI * t / 2.2);
  return { x: p.x, y: p.y + dy, s: p.s, sq, vis };
}

/* ---------- his face ---------- */
const LENS = { w: 0 };
const AT = (x, y) => ({ x, y, w: 1 });
const LOOKS = [
  { at: 0, to: LENS },
  { at: POPIN, to: AT(270, LAB_Y) },
  { at: TICK + 0.15, to: LENS },
  { at: M4.at + 0.2, to: AT(270, 470) },
  { at: BACK + 0.5, to: LENS },
  { at: TAKE6, to: AT(270, BAR.y + 10) },
  { at: BAR99, to: LENS },
  { at: SLAM + 0.08, to: AT(POP.cx, POP.cy) },
  { at: CLICK - 0.2, to: AT(POP.cx, POP.cy + 80) },
  { at: SHUT + 0.05, to: AT(270, BAR.y + 10) },
  { at: TURN, to: LENS },
];
const BLINKS = [1.9, L2.at + 0.15, L4.at + 0.1, L5.at + 0.4, L6.at + 0.05, L7.at + 0.6].map(f3);
const HAPPY = [AI, AI2, BAR99 + 0.02];
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
  /* the squint at the lens, after the takeover is put off */
  lid = Math.max(lid, 0.04 + 0.42 * smooth(span(t, SQUINT, SQUINT + 0.2)));
  let arc = 0;
  for (const h of HAPPY) arc = Math.max(arc, bump(t, h, 0.08, 0.26, 0.12));
  return { lid: f3(lid), arc: f3(arc), look, dx: f2(p.x - MAS.cx), dy: f2(p.y - MAS.cy), rot: 0, sq: f3(p.sq), s: f3(p.s) };
}

/* ---------- the letters ---------- */
const plain = (s, o = 1) => [...s].map((c, j) => ({ c, i: null, j, u: 1, o, y: 0, b: 0, g: 0 }));
const fromMorph = (P, t, at) => morphAt(P, t, at).map(l => ({ c: l.c, i: l.i, j: l.j, u: l.u, o: l.o, y: l.y, b: l.blur, g: l.born ? f3(1 - smooth(span(t, at + 0.7, at + 1.3))) : 0 }));
const MPLAN = NAMES.map(([a, b]) => morphPlan(a, b));
const LABS = [
  { k: 0, in: BEN, m: MORPH_BB, out: M2.at },
  { k: 1, in: DOWN, m: DOWNLOAD, out: M3.at },
  { k: 2, in: DUBAIW, m: DUB, out: M4.at },
  { k: 3, in: GREAT, m: 1e9, out: M5.at },
];
const HI = [{ c: C_UK, a: M1.at + 0.5, b: M2.at }, { c: C_AUS, a: AUS - 0.1, b: M3.at }, { c: C_UAE, a: DUBAIW - 0.1, b: M4.at }, { c: C_CHN, a: CHINA - 0.1, b: M5.at }];

/* ---------- the map, a frame of it ---------- */
const HOMEPT = { x: HOME.x, y: HOME.y + 40 };
const R3 = v => +v.toFixed(3);
function mapState(t) {
  const s0 = cam(t), s1 = cam(t - 0.5 / 60);
  const q = toScreen(s1, { x: s0.ax, y: s0.ay });
  const mv = Math.hypot(q.x - s0.sx, q.y - s0.sy) + 300 * Math.abs(Math.log(s0.k / s1.k));
  const shots = (mv > 2 ? shutter(t, Math.min(32, Math.ceil(mv / 1.5)), 60).map(cam) : [s0]).map(s => ({ ax: R3(s.ax), ay: R3(s.ay), sx: R3(s.sx), sy: R3(s.sy), k: +s.k.toFixed(5) }));
  const L = new Array(NC), G = new Array(NC);
  for (let c = 0; c < NC; c++) {
    const p = MAPC[c].cen;
    let lv = 1, g = 0;
    /* line 1: a ripple out of him, and a pulse on ROUND 2 */
    lv += 0.8 * hitPulse(t - rippleAt(RIP, HOMEPT, p, 520), 0.04, 0.16);
    lv += 0.6 * hitPulse(t - rippleAt(ROUND, HOMEPT, p, 900), 0.03, 0.12);
    /* the slow sweep, left to right, on taking */
    const sw = rippleAt(SWEEP, { x: -60, y: p.y }, p, SWEEP_V);
    const swk = Math.sin(Math.PI * span(t, sw, sw + 0.8));
    lv += 1.1 * swk; g += 0.35 * swk;
    /* the four renamed places glow green from the pull back, and go out on the drop */
    if (FOUR.includes(c)) {
      const gk = smooth(span(t, TAKE6 + 0.1 * FOUR.indexOf(c), TAKE6 + 0.1 * FOUR.indexOf(c) + 0.2)) * (1 - smooth(span(t, DROP + 0.1, DROP + 0.45)));
      lv += 0.7 * gk; g += 0.9 * gk;
    }
    lv *= 1 - 0.35 * smooth(span(t, DROP + 0.1, DROP + 0.5));
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
  if (t > RIP && t < RIP + 1.3) rings.push({ x: HOMEPT.x, y: HOMEPT.y, r: f2((t - RIP) * 520), a: f3(0.5 * (1 - span(t, RIP, RIP + 1.3))) });
  if (t > ROUND && t < ROUND + 1.0) rings.push({ x: HOMEPT.x, y: HOMEPT.y, r: f2((t - ROUND) * 900), a: f3(0.4 * (1 - span(t, ROUND, ROUND + 1.0))) });
  if (t > TAKE6 && t < TAKE6 + 1.2) rings.push({ x: HOMEPT.x, y: HOMEPT.y, r: f2((t - TAKE6) * 600), a: f3(0.4 * (1 - span(t, TAKE6, TAKE6 + 1.2))) });
  /* the sweep's band through the dot grid */
  const sx = -60 + (t - SWEEP) * SWEEP_V;
  const swp = t > SWEEP && sx < 620 ? { x: f2(sx), a: 0.45 } : null;
  return { s: shots, L, G, hi, ha, tr, rings, swp };
}

/* ---------- the landmarks, line art in screen px, feet at 0,0 ---------- */
/* each sits in a box W x H, its feet at (W/2, H - 10) */
const LM = {
  bb: { W: 120, H: 320, pt: LONDON, shot: SH.uk, sc: 0.82 },
  sky: { W: 340, H: 300, pt: DUBAI, shot: SH.uae, sc: 0.9 },
  wall: { W: 400, H: 130, pt: WALLPT, shot: SH.chn, sc: 1 },
};
const vb = L => `${-L.W / 2} ${-(L.H - 10)} ${L.W} ${L.H}`;
const ST = 'fill:#06070a;stroke:#e9eeec;stroke-width:1.8;stroke-linejoin:round;stroke-linecap:round';
const LN = 'fill:none;stroke:rgba(233,238,236,.7);stroke-width:1.2;stroke-linecap:round';
const BIGBEN = `
  <path d="M-55 0 H55" style="${LN}"/>
  <path d="M-20 0 V-150 H20 V0 Z" style="${ST}"/>
  <path d="M-10 -4 V-146 M10 -4 V-146 M-20 -50 H20 M-20 -100 H20" style="${LN}"/>
  <path d="M-26 -150 V-205 H26 V-150 Z" style="${ST}"/>
  <path d="M-21 -205 V-232 H21 V-205 Z" style="${ST}"/>
  <path d="M-13 -207 V-222 A4 4 0 0 1 -5 -222 V-207 M5 -207 V-222 A4 4 0 0 1 13 -222 V-207" style="${LN}"/>
  <path d="M-21 -232 L0 -290 L21 -232 Z" style="${ST}"/>
  <path d="M0 -290 V-302 M-26 -205 L-23 -216 L-20 -205 M20 -205 L23 -216 L26 -205" style="${LN}"/>
  <g id="bbClock"><circle cx="0" cy="-178" r="18" style="${ST}"/><circle cx="0" cy="-178" r="13.5" style="fill:none;stroke:rgba(233,238,236,.45);stroke-width:1;stroke-dasharray:1.5 5.57"/><path d="M0 -178 V-189 M0 -178 L7 -174" style="fill:none;stroke:#e9eeec;stroke-width:1.8;stroke-linecap:round"/></g>
  <g id="bbBrain" style="opacity:0"><g transform="translate(0 -178)"><g id="bbBrainS">
    <circle r="19" style="fill:#06070a;stroke:none"/>
    <path d="M-1 -15 C-6 -20 -16 -18 -18 -11 C-24 -8 -24 2 -19 5 C-20 12 -13 17 -6 15 C-3 18 -1 16 -1 13 Z M1 -15 C6 -20 16 -18 18 -11 C24 -8 24 2 19 5 C20 12 13 17 6 15 C3 18 1 16 1 13 Z" style="fill:none;stroke:var(--accent);stroke-width:1.9;stroke-linejoin:round"/>
    <path d="M-12 -10 C-8 -8 -10 -3 -6 -2 M-16 0 C-12 2 -10 6 -6 6 M12 -10 C8 -8 10 -3 6 -2 M16 0 C12 2 10 6 6 6" style="fill:none;stroke:var(--accent);stroke-width:1.4;stroke-linecap:round"/>
  </g></g></g>`;
/* the burj in the middle, stepped to its needle, and a skyline either side */
const towers = [[-150, -128, 84], [-122, -98, 128], [-92, -70, 70], [-64, -42, 104], [40, 62, 116], [68, 92, 78], [98, 122, 140], [128, 150, 92]];
const SKYLINE = `
  <path d="M-165 0 H165" style="${LN}"/>
  ${towers.map(([a, b, h], n) => `<path d="M${a} 0 V${-h + (n === 1 || n === 6 ? 10 : 0)} ${n === 1 || n === 6 ? `L${(a + b) / 2} ${-h}` : ''} L${b} ${-h + (n === 1 ? 10 : 0)} V0 Z" style="${ST}"/><path d="${Array.from({ length: Math.floor(h / 22) }, (_, r) => `M${a + 5} ${-14 - r * 22} H${b - 5}`).join(' ')}" style="${LN};stroke:rgba(233,238,236,.35)"/>`).join('\n  ')}
  <path d="M-17 0 V-60 H-13 V-118 H-9.5 V-168 H-6 V-208 H-2.5 L0 -262 L2.5 -208 H6 V-168 H9.5 V-118 H13 V-60 H17 V0 Z" style="${ST}"/>
  <path d="M0 -6 V-200" style="${LN};stroke:rgba(233,238,236,.4)"/>
  <circle cx="0" cy="-262" r="1.8" style="fill:var(--accent)"/>`;
/* a short run of wall on a ridge, crenels on top, two towers, the text rows in it */
const ridge = x => -14 * Math.sin(x / 60) - 6 * Math.sin(x / 23 + 1);
const WX0 = -180, WX1 = 180, WH = 22;
const wallPath = dy => { let d = ''; for (let x = WX0; x <= WX1; x += 6) d += (x === WX0 ? 'M' : 'L') + x + ' ' + f2(ridge(x) + dy) + ' '; return d.trim(); };
const crenels = (() => { let d = ''; for (let x = WX0; x + 6 <= WX1; x += 12) { const y = ridge(x + 3) - WH; d += `M${x + 2} ${f2(y)} V${f2(y - 5)} H${x + 8} V${f2(y)} `; } return d.trim(); })();
const tower = x => { const y = ridge(x); return `<path d="M${x - 14} ${f2(y + 2)} V${f2(y - WH - 22)} H${x + 14} V${f2(y + 2)} Z" style="${ST}"/><path d="M${x - 14} ${f2(y - WH - 22)} V${f2(y - WH - 28)} H${x - 8} V${f2(y - WH - 22)} M${x - 3} ${f2(y - WH - 22)} V${f2(y - WH - 28)} H${x + 3} V${f2(y - WH - 22)} M${x + 8} ${f2(y - WH - 22)} V${f2(y - WH - 28)} H${x + 14} V${f2(y - WH - 22)} M${x - 4} ${f2(y - WH - 6)} V${f2(y - WH - 14)} H${x + 4} V${f2(y - WH - 6)}" style="${LN}"/>`; };
const WALL_ROWS = [-5, -10.5, -16];
const wallBody = (() => { const xs = []; for (let x = WX0; x <= WX1; x += 6) xs.push(x); return 'M' + xs.map(x => x + ' ' + f2(ridge(x))).join(' L') + ' L' + xs.reverse().map(x => x + ' ' + f2(ridge(x) - WH)).join(' L') + ' Z'; })();
const GREATWALL = `
  <path d="${wallBody}" style="${ST}"/>
  <path d="${crenels}" style="${LN}"/>
  ${WALL_ROWS.map((dy, r) => `<path id="wr${r}" d="${wallPath(dy)}" style="fill:none;stroke:none"/>`).join('')}
  <g id="wtext" style="font:500 4.6px var(--mono);fill:rgba(140,255,180,.85);letter-spacing:.02em">
    ${WALL_ROWS.map((dy, r) => `<text><textPath id="wt${r}" href="#wr${r}" startOffset="0">${WALLTXT}</textPath></text>`).join('')}
  </g>
  ${tower(-95)}${tower(88)}`;

/* ---------- a frame of the story ---------- */
function frame(t) {
  const S = [], X = [], TX = [], A = [];
  const box = (id, o, s = 1, y = 0) => S.push([id, 'opacity', f3(o)], [id, 'transform', 'translateY(' + f2(y) + 'px) scale(' + f3(s) + ')']);
  /* the title and the tag: whole on frame 0, a punch on AI, ROUND 2 slams on round, out the top on the zoom */
  const tOut = CURVE56.in(span(t, M1.at - 0.05, M1.at + 0.2));
  const tP = 1 + 0.03 * hitPulse(t - AI) + 0.025 * hitPulse(t - WORLD1);
  box('t1', 1 - tOut, tP, -30 * tOut); box('t2', 1 - tOut, tP, -30 * tOut);
  const rs = t < ROUND ? 1 : lerp(1.45, 1, CURVE.out(span(t, ROUND, ROUND + 0.25)));
  const rb = t >= ROUND && t < ROUND + 0.2 ? 14 * (1 - CURVE.out(span(t, ROUND, ROUND + 0.2))) : 0;
  S.push(['r2', 'opacity', f3(1 - tOut)], ['r2', 'transform', 'translateY(' + f2(-30 * tOut) + 'px) scale(' + f3(rs) + ')'], ['r2', 'filter', rb > 0.75 ? 'blur(' + f2(rb) + 'px)' : 'none']);
  S.push(['r2', '--fl', f3(t >= ROUND ? Math.exp(-(t - ROUND) / 0.35) : 0)]);
  /* the country label */
  let lab = null;
  for (const L of LABS) if (t >= L.in - 0.01 && t < L.out + 0.25) lab = L;
  if (lab) {
    const P = MPLAN[lab.k], inn = wordIn(t, lab.in, 'rise'), o = CURVE56.in(span(t, lab.out, lab.out + 0.2));
    const morphed = t >= lab.m;
    let Ls = morphed ? fromMorph(P, t, lab.m) : plain(P.from);
    /* DUB AI: the AI goes green and stays */
    if (lab.k === 2 && morphed) { const g = smooth(span(t, AI_GLOW, AI_GLOW + 0.2)); Ls = Ls.map(l => (l.j != null && l.j >= 4 ? { ...l, g: f3(Math.max(l.g, g)) } : l)); }
    TX.push({ id: 'lab', text: morphed ? P.to : P.from, from: morphed ? P.from : null, size: 26, ls: 0.06, L: Ls });
    S.push(['lab', 'opacity', f3(inn.o * (1 - o))], ['lab', 'transform', 'translateY(' + f2(inn.y - 26 * o) + 'px) scale(' + f3(1 + 0.025 * hitPulse(t - lab.m - 0.45) + 0.03 * (lab.k === 2 ? hitPulse(t - AI_GLOW) : 0)) + ')'], ['lab', 'filter', inn.blur > 0 ? 'blur(' + inn.blur + 'px)' : 'none']);
  } else S.push(['lab', 'opacity', 0]);
  /* OF TEXT types in under THE GREAT WALL */
  if (t >= OF && t < M5.at + 0.25) {
    const n = Math.floor(CURVE56.type(span(t, OF, OF + 0.4)) * OFTEXT.length + 1e-6);
    TX.push({ id: 'lab2', text: OFTEXT, size: 26, ls: 0.06, L: plain(OFTEXT).map((l, j) => ({ ...l, o: j < n ? 1 : 0, g: j < n ? f3(1 - smooth(span(t, TEXTW + 0.3, TEXTW + 0.9))) : 0 })) });
    const o = CURVE56.in(span(t, M5.at, M5.at + 0.2));
    box('lab2', 1 - o, 1 + 0.03 * hitPulse(t - TEXTW - 0.1), -26 * o);
  } else S.push(['lab2', 'opacity', 0]);
  /* the tick beside DUB AI */
  const tk = CURVE.out(span(t, TICK, TICK + 0.3)), tkO = CURVE56.in(span(t, M4.at, M4.at + 0.2));
  S.push(['tick', 'opacity', f3((t >= TICK ? 1 : 0) * (1 - tkO))], ['tick', 'transform', 'scale(' + f3(lerp(0.5, 1, SPRING(span(t, TICK, TICK + 0.35)))) + ')'], ['tickp', 'stroke-dashoffset', f3(1 - tk)]);

  /* the landmarks ride the map: their feet on their spot, sized with the zoom */
  const sh = cam(t);
  const place3 = (id, L, a, d, out, dir) => {
    const p = toScreen(sh, L.pt), sc = L.sc * Math.min(1.5, Math.max(0.25, sh.k / L.shot.k));
    const o = (t >= a ? 1 : 0) * (1 - smooth(span(t, out - 0.08, out + 0.06)));
    S.push([id, 'opacity', f3(o)], [id, 'transform', 'translate(' + f2(p.x - L.W / 2) + 'px,' + f2(p.y - (L.H - 10)) + 'px) scale(' + f3(sc) + ')']);
    const r = CURVE.out(span(t, a, a + d));
    /* rising: the clip opens from the feet up, the wall from left to right */
    const clip = dir === 'up' ? 'inset(' + f2(100 * (1 - r)) + '% -20px 0 -20px)' : 'inset(-20px ' + f2(100 * (1 - r)) + '% -20px 0)';
    S.push([id + 'c', 'clip-path', r >= 1 ? 'none' : clip]);
    const scan = r > 0 && r < 1 ? 1 - smooth(span(r, 0.85, 1)) : 0;
    S.push([id + 's', 'opacity', f3(scan)], [id + 's', 'transform', dir === 'up' ? 'translateY(' + f2((L.H - 10) * (1 - r)) + 'px)' : 'translateX(' + f2(L.W * r) + 'px)']);
  };
  place3('bb', LM.bb, BB_IN, BB_D, M2.at, 'up');
  place3('sky', LM.sky, SKY_IN, SKY_D, M4.at, 'up');
  place3('wall', LM.wall, WALL_IN, WALL_D, M5.at, 'side');
  /* big ben's clock becomes a brain */
  const mb = smooth(span(t, MORPH_BB, MORPH_BB + 0.18));
  S.push(['bbClock', 'opacity', f3(1 - mb)]);
  S.push(['bbBrain', 'opacity', f3(mb)], ['bbBrainS', 'transform', 'scale(' + f3(t < MORPH_BB ? 0.5 : lerp(0.6, 1.7, SPRING(span(t, MORPH_BB, MORPH_BB + 0.45)))) + ')']);
  S.push(['bbBrain', 'filter', mb > 0 ? 'drop-shadow(0 0 4px rgba(80,255,140,' + f3(0.5 + 0.5 * hitPulse(t - MORPH_BB - 0.05, 0.04, 0.2)) + '))' : 'none']);
  /* the wall of text scrolls left */
  const sc = t < SCROLL0 ? 0 : (t - SCROLL0);
  for (let r = 0; r < WALL_ROWS.length; r++) A.push(['wt' + r, 'startOffset', f2(-(sc * (34 + 9 * r)) - r * 40)]);
  S.push(['wtext', 'opacity', f3(t < SCROLL0 ? 0 : smooth(span(t, SCROLL0, SCROLL0 + 0.25)))]);

  /* the loading bar across australia */
  {
    const p = toScreen(sh, AUSC), scl = Math.min(1.5, Math.max(0.25, sh.k / SH.aus.k));
    const o = (t >= BAR_IN ? smooth(span(t, BAR_IN, BAR_IN + 0.12)) : 0) * (1 - smooth(span(t, M3.at, M3.at + 0.2)));
    S.push(['ld', 'opacity', f3(o)], ['ld', 'transform', 'translate(' + f2(p.x - 150) + 'px,' + f2(p.y - 9) + 'px) scale(' + f3(scl * (1 + 0.04 * hitPulse(t - FILL1))) + ')']);
    S.push(['ldf', 'width', f2(100 * CURVE.dolly(span(t, FILL0, FILL1))) + '%']);
  }

  /* the bar: in on takeover, 99 on done, drops when the popup shuts */
  const bIn = t < TAKE6 ? hidden : wordIn(t, TAKE6, 'rise');
  const fill = CURVE.out(span(t, TAKE6, BAR99)) * (1 - EASE(span(t, DROP, DROP + 0.45)));
  S.push(['bar', 'opacity', f3(bIn.o)], ['bar', 'transform', 'translateY(' + f2(bIn.y) + 'px) scale(' + f3(1 + 0.03 * hitPulse(t - BAR99)) + ')'], ['bar', 'filter', bIn.blur > 0 ? 'blur(' + bIn.blur + 'px)' : 'none']);
  S.push(['fill', 'width', f2(99 * fill) + '%']);
  X.push(['pct', Math.round(99 * fill) + '%']);
  S.push(['cur', 'opacity', t > BAR99 + 0.3 && t < DROP ? (Math.floor((t - BAR99) * 3.5) % 2 ? 0.15 : 0.9) : 0]);

  /* the popup: slams, the button goes down on the click, it shuts */
  const sl = wordIn(t, SLAM, 'slam'), shut = CURVE56.in(span(t, SHUT, SHUT + 0.16));
  S.push(['pop', 'opacity', f3(t < SLAM ? 0 : sl.o * (1 - shut))], ['pop', 'transform', 'scale(' + f3((t < SLAM ? 1.12 : 1 + (sl.s - 1) * 0.6) * lerp(1, 0.88, shut)) + ')'], ['pop', 'filter', t >= SLAM && sl.blur > 0 ? 'blur(' + sl.blur + 'px)' : 'none']);
  const press = bump(t, CLICK, 0.04, 0.08, 0.1);
  S.push(['bRm', 'transform', 'scale(' + f3(1 - 0.05 * press) + ')'], ['bRm', '--pr', f3(t >= CLICK ? 1 : 0)]);
  /* the cursor, EARTH on its tag, glides up to the button and clicks */
  {
    const k = CURVE.cam(span(t, CUR_IN, CLICK - 0.06));
    const x = lerp(500, POP.cx + 40, k), y = lerp(800, POP.cy + 52, k) - 26 * Math.sin(Math.PI * k);
    const o = smooth(span(t, CUR_IN, CUR_IN + 0.1)) * (1 - smooth(span(t, SHUT + 0.25, SHUT + 0.45)));
    S.push(['cursor', 'opacity', f3(t < CUR_IN ? 0 : o)], ['cursor', 'transform', 'translate(' + f2(x) + 'px,' + f2(y) + 'px) scale(' + f3(1 - 0.12 * press) + ')']);
  }

  /* the crown rides his head, and slides off when the bar drops */
  const b = body(t), top = b.y - 118 * b.s * (1 - b.sq) / 2;
  const off = span(t, CROWN_OFF, CROWN_OFF + 0.55) ** 2;
  S.push(['mas-cut', 'opacity', f3(b.vis)]);
  S.push(['gem', 'transform', 'scale(' + f3(1 + 0.9 * hitPulse(t - ROUND, 0.04, 0.12)) + ')']);
  S.push(['crown', 'transform', 'translate(' + f2(b.x - 22 + 34 * off) + 'px,' + f2(top - 22 + 4 * b.s + 70 * off) + 'px) rotate(' + f2(-7 + 62 * off) + 'deg) scale(' + f3(b.s / 0.85) + ')'], ['crown', 'opacity', f3(b.vis * (1 - smooth(span(t, CROWN_OFF + 0.25, CROWN_OFF + 0.5))))]);
  return { S, X, T: TX, A, M: mapState(t) };
}

/* ---------- the drawing ---------- */
const GLOW = 'drop-shadow(0 0 1px #fff) drop-shadow(0 0 14px rgba(255,255,255,.65)) drop-shadow(0 0 34px rgba(255,255,255,.32))';
const GLOW_LO = 'drop-shadow(0 0 1px #fff) drop-shadow(0 0 9px rgba(255,255,255,.45)) drop-shadow(0 0 22px rgba(255,255,255,.22))';
const GLOW_LM = 'drop-shadow(0 0 1px rgba(255,255,255,.9)) drop-shadow(0 0 6px rgba(255,255,255,.4)) drop-shadow(0 0 16px rgba(255,255,255,.18))';
const GREEN_GLOW = 'drop-shadow(0 0 1px var(--accent)) drop-shadow(0 0 10px rgba(80,255,140,.5)) drop-shadow(0 0 24px rgba(80,255,140,.24))';
const lmCss = (id, L) => `#${id}{position:absolute;left:0;top:0;width:${L.W}px;height:${L.H}px;transform-origin:${L.W / 2}px ${L.H - 10}px;opacity:0;will-change:transform,opacity}
#${id}c{position:absolute;inset:0}
#${id}c svg{position:absolute;inset:0;width:${L.W}px;height:${L.H}px;overflow:visible;filter:${GLOW_LM}}`;
const css = `
#map{position:absolute;left:0;top:0;width:540px;height:960px}
.big{position:absolute;left:0;right:0;height:0;display:flex;justify-content:center;will-change:transform,opacity}
.big b{display:block;font:400 30px/1 var(--display);color:#f7f9f8;letter-spacing:.04em;white-space:nowrap;-webkit-text-stroke:1px #fff;filter:${GLOW};transform:translateY(-50%)}
#r2{position:absolute;left:0;right:0;height:0;display:flex;justify-content:center;transform-origin:50% 0;will-change:transform,opacity}
#r2 b{display:block;transform:translateY(-50%);font:400 14px/1 var(--display);letter-spacing:.16em;color:var(--accent);padding:6px 9px 5px 11px;border:1.5px solid var(--accent);border-radius:4px;background:rgba(6,7,10,.85);
  filter:drop-shadow(0 0 1px var(--accent)) drop-shadow(0 0 calc(6px + 16px * var(--fl,0)) rgba(80,255,140,calc(.35 + .5 * var(--fl,0))))}
.tx{position:absolute;left:0;width:540px;height:0;transform-origin:270px 0;will-change:transform,opacity}
.tx .in{position:absolute;left:270px;top:0;transform:translate(-50%,-50%);font-family:var(--display);font-weight:400;white-space:nowrap;line-height:1}
.tx .in s{text-decoration:none;visibility:hidden}
.tx .in i{position:absolute;left:50%;top:50%;font-style:normal;color:#f7f9f8;will-change:transform}
.tx::before{content:'';position:absolute;left:270px;top:0;width:var(--pw,380px);height:var(--ph,70px);transform:translate(-50%,-50%);background:radial-gradient(closest-side,rgba(6,7,10,.9),rgba(6,7,10,.65) 55%,rgba(6,7,10,0))}
#lab{--pw:470px;--ph:72px}
#lab2{--pw:300px;--ph:60px}
#lab .in,#lab2 .in{font-size:26px;letter-spacing:.06em;filter:${GLOW_LO}}
#tick{position:absolute;left:${270 + 112}px;top:${LAB_Y - 13}px;width:26px;height:22px;transform-origin:13px 11px;opacity:0;filter:${GREEN_GLOW}}
#tick svg{width:26px;height:22px;overflow:visible}
${lmCss('bb', LM.bb)}
${lmCss('sky', LM.sky)}
${lmCss('wall', LM.wall)}
.scan{position:absolute;opacity:0;background:linear-gradient(90deg,rgba(80,255,140,0),rgba(170,255,200,.9),rgba(80,255,140,0));filter:${GREEN_GLOW}}
#bbs,#skys{left:0;right:0;top:0;height:2px}
#walls{left:0;top:0;bottom:0;width:2px;background:linear-gradient(180deg,rgba(80,255,140,0),rgba(170,255,200,.9),rgba(80,255,140,0))}
#ld{position:absolute;left:0;top:0;width:300px;height:18px;transform-origin:150px 9px;opacity:0;will-change:transform,opacity}
#ld::before{content:'';position:absolute;left:-30px;right:-30px;top:-16px;bottom:-16px;background:radial-gradient(closest-side,rgba(6,7,10,.85),rgba(6,7,10,0))}
#ldt{position:absolute;inset:0;border:2px solid #e9eeec;border-radius:4px;filter:${GLOW_LO}}
#ldf{position:absolute;left:3px;top:3px;bottom:3px;width:0;max-width:calc(100% - 6px);border-radius:2px;background:var(--accent);filter:${GREEN_GLOW}}
#bar{position:absolute;left:${BAR.l}px;width:${BAR.r - BAR.l}px;top:${BAR.y - 16}px;opacity:0;transform-origin:50% 50%;will-change:transform,opacity}
#bar::before{content:'';position:absolute;left:-40px;right:-40px;top:-22px;bottom:-22px;z-index:-1;background:radial-gradient(closest-side,rgba(6,7,10,.9),rgba(6,7,10,.6) 60%,rgba(6,7,10,0))}
#bar .row{display:flex;justify-content:space-between;align-items:baseline;font:400 15px/1 var(--display);color:#f7f9f8;letter-spacing:.1em;filter:${GLOW_LO}}
#pct{font-size:22px;color:var(--accent);filter:${GREEN_GLOW}}
#trk{position:relative;margin-top:12px;height:14px;border:2px solid #e9eeec;border-radius:4px;filter:${GLOW_LO}}
#fill{position:absolute;left:2px;top:2px;bottom:2px;width:0;border-radius:2px;background:var(--accent);max-width:calc(100% - 4px)}
#cur{position:absolute;right:2px;top:2px;bottom:2px;width:calc(1% + 1px);background:#e9eeec;opacity:0}
#pop{position:absolute;left:${POP.cx - POP.w / 2}px;width:${POP.w}px;top:${POP.cy - 108}px;height:216px;opacity:0;transform-origin:50% 50%;will-change:transform,opacity;
  background:#08090c;border:2px solid #e9eeec;border-radius:10px;box-sizing:border-box;padding:26px 12px 0;text-align:center}
#pop .ph{font:400 16px/1.5 var(--display);letter-spacing:.06em;color:#f7f9f8;white-space:nowrap;filter:${GLOW_LO}}
#pop .btn{margin:12px auto 0;width:290px;height:38px;box-sizing:border-box;border-radius:6px;font:500 15px/34px var(--read);letter-spacing:.08em;white-space:nowrap}
#pop .btn:first-of-type{margin-top:20px}
#bUp{background:var(--accent);color:#06070a;border:2px solid var(--accent)}
#bRm{border:2px solid #e9eeec;color:#f7f9f8;background:color-mix(in srgb,#e9eeec calc(var(--pr,0) * 22%),#08090c)}
#cursor{position:absolute;left:0;top:0;width:28px;height:39px;transform-origin:2px 2px;opacity:0;z-index:8;will-change:transform,opacity}
#cursor svg{width:28px;height:39px;overflow:visible;filter:drop-shadow(0 0 6px rgba(255,255,255,.35))}
#cursor span{position:absolute;left:22px;top:36px;font:500 13px/1 var(--mono);letter-spacing:.12em;color:#f7f9f8;padding:3px 5px 2px;border:1px solid #e9eeec;border-radius:3px;background:#06070a}
#crown{position:absolute;left:0;top:0;width:44px;height:26px;transform-origin:22px 26px;z-index:7;will-change:transform,opacity}
#crown svg{width:44px;height:26px;overflow:visible;filter:${GLOW_LO}}
`;
const tx = (id, y, ghost) => `<div class="tx" id="${id}" style="top:${y}px"><div class="in"><s>${ghost}</s></div></div>`;
const lmHtml = (id, L, inner, dir) => `<div id="${id}"><div id="${id}c"><svg viewBox="${vb(L)}">${inner}</svg></div><div class="scan" id="${id}s"></div></div>`;
const markup = `
<canvas id="map" width="1080" height="1920"></canvas>
<div id="r2" style="top:${TY.r2}px"><b>${R2}</b></div>
<div class="big" id="t1" style="top:${TY.t1}px"><b>${T1}</b></div>
<div class="big" id="t2" style="top:${TY.t2}px"><b>${T2}</b></div>
${lmHtml('bb', LM.bb, BIGBEN, 'up')}
${lmHtml('sky', LM.sky, SKYLINE, 'up')}
${lmHtml('wall', LM.wall, GREATWALL, 'side')}
<div id="ld"><div id="ldt"></div><div id="ldf"></div></div>
${tx('lab', LAB_Y, 'DOWNLOAD UNDER')}
${tx('lab2', LAB2_Y, OFTEXT)}
<div id="tick"><svg viewBox="0 0 26 22"><path id="tickp" pathLength="1" d="M3 12 L10 19 L23 3" style="fill:none;stroke:var(--accent);stroke-width:3.4;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1;stroke-dashoffset:1"/></svg></div>
<div id="bar"><div class="row"><span>${WT}</span><span id="pct">0%</span></div><div id="trk"><div id="fill"></div><div id="cur"></div></div></div>`;
const front = `
<div id="crown"><svg viewBox="0 0 44 26">
  <path d="M5 23 L3 6 L13.5 13.5 L22 2 L30.5 13.5 L41 6 L39 23 Z" style="fill:#06070a;stroke:#e9eeec;stroke-width:2.4;stroke-linejoin:round"/>
  <circle id="gem" cx="22" cy="17.5" r="2.4" style="fill:var(--accent);transform-origin:22px 17.5px"/>
</svg></div>
<div id="pop"><div class="ph">${POP_H1}<br>${POP_H2}</div><div class="btn" id="bUp">${BTN_UP}</div><div class="btn" id="bRm">${BTN_RM}</div></div>
<div id="cursor"><svg viewBox="0 0 20 28"><path d="M2 2 L2 22 L7.2 17.2 L11 26 L14.6 24.4 L10.8 15.8 L17.6 15.8 Z" style="fill:#f7f9f8;stroke:#06070a;stroke-width:1.6;stroke-linejoin:round"/></svg><span>${CUR_TAG}</span></div>`;

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
  const path = f => { const p = new Path2D(); p.moveTo(f[0], f[1]); for (let i = 2; i < f.length; i += 2) p.lineTo(f[i], f[i + 1]); return p; };
  const CO = D.c.map(c => { const p = new Path2D(); for (const f of c.co) p.addPath(path(f)); return p; });
  const BO = D.c.map(c => c.bo.map(([o, f]) => [o, path(f)]));
  const TRC = {};
  for (const k in D.tr) { const f = D.tr[k], cum = [0]; for (let i = 2; i < f.length; i += 2) cum.push(cum[cum.length - 1] + Math.hypot(f[i] - f[i - 2], f[i + 1] - f[i - 1])); TRC[k] = { f, cum }; }
  function drawMap(m) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    for (let y = 8; y < 960; y += 16) for (let x = 6; x < 540; x += 16) {
      let b = 0;
      for (const r of m.rings) { const d = Math.hypot(x - r.x, y - r.y) - r.r; b += r.a * Math.exp(-(d * d) / 450); }
      if (m.swp) { const d = x - m.swp.x; b += m.swp.a * Math.exp(-(d * d) / 1400); }
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
    const XT = lay(e.text, e.size, e.ls);
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
      for (const [id, k, v] of o.S) {
        const key = id + '#' + k;
        if (last[key] === v) continue;
        last[key] = v;
        if (k.startsWith('--')) $(id).style.setProperty(k, v); else $(id).style[k.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = v;
      }
      for (const [id, k, v] of o.A) { const key = id + '@' + k; if (last[key] !== v) { last[key] = v; $(id).setAttribute(k, v); } }
      for (const [id, v] of o.X) if ($(id).textContent !== v) $(id).textContent = v;
      for (const e of o.T) text(e);
      drawMap(o.M);
    },
  };
}

/* ---------- the sound: on contact or on the fastest frame, nothing in the hush ---------- */
const CUES = [
  { t: RIP + 0.01, kind: 'pop', from: 'the ripple out of him' },
  { t: ROUND + 0.02, kind: 'popDeep', from: 'ROUND 2 slams' },
  { t: peakAt(M1.at, M1.at + M1.d, M1.curve), kind: 'whooshUp', opts: { len: 0.34 }, from: 'the zoom to london, fastest frame' },
  { t: BB_IN + 0.02, kind: 'sweep', opts: { len: 0.55 }, from: 'big ben rises' },
  { t: MORPH_BB + 0.02, kind: 'pop', from: 'the clock becomes a brain' },
  { t: peakAt(M2.at, M2.at + M2.d, M2.curve) - 0.12, kind: 'whoosh', opts: { len: 0.3 }, from: 'the whip to australia, fastest frame' },
  { t: FILL0, kind: 'riser', opts: { len: 1.0 }, from: 'the download bar fills' },
  { t: FILL1, kind: 'ding', from: 'the download completes' },
  { t: peakAt(M3.at, M3.at + M3.d, M3.curve) - 0.12, kind: 'whoosh', opts: { len: 0.28 }, from: 'the whip to the emirates, fastest frame' },
  { t: DUB + 0.02, kind: 'glitch', opts: { len: 0.1 }, from: 'DUBAI splits' },
  { t: POPIN + 0.02, kind: 'pop', from: 'he pops in' },
  { t: TICK + 0.04, kind: 'ding', opts: { f: 1320, tau: 0.05, len: 0.2 }, from: 'the tick lands' },
  { t: peakAt(M4.at, M4.at + M4.d, M4.curve) - 0.1, kind: 'whooshUp', opts: { len: 0.3 }, from: 'the glide to china' },
  ...[0, 1, 2].map(k => ({ t: OF + 0.04 + k * 0.12, kind: 'key', from: 'OF TEXT types' })),
  { t: peakAt(M5.at, M5.at + M5.d, M5.curve) - 0.15, kind: 'whooshUp', opts: { len: 0.4 }, from: 'the pull back, fastest frame' },
  { t: BACK + 0.48, kind: 'land', from: 'he lands home' },
  { t: BAR99, kind: 'ding', from: 'the bar hits 99' },
  { t: SLAM, kind: 'popDeep', from: 'the popup slams' },
  { t: CLICK + 0.01, kind: 'click', from: 'the cursor clicks' },
  { t: SHUT + 0.02, kind: 'tock', opts: { f: 1500 }, from: 'the popup shuts' },
  { t: DROP + 0.04, kind: 'hum', opts: { len: 0.7, f: 58, rise: 0.02, fall: 0.6 }, from: 'the bar drops' },
  { t: CUT - 0.09, kind: 'zap', from: 'glitch' },
  { t: CUT, kind: 'bass', opts: { len: +(HOLD - 0.02).toFixed(3) }, from: 'the end card' },
].map(c => ({ ...c, t: +c.t.toFixed(4) }));
for (const c of CUES) if (c.t > L6.end - 0.05 && c.t < L7.at - 0.03) throw new Error('an effect in the silence: ' + c.from);

const BEATS = [RIP, AI, TAKING, WORLD1, ROUND, M1.at, BB_IN, MORPH_BB, M2.at, DOWNLOAD, FILL1, M3.at, DUB, POPIN, TICK, M4.at, WALL_IN, OF, M5.at, TAKE6, BAR99, SLAM, CLICK, DROP, TURN];
const STILLS = [0, RIP + 0.3, ROUND + 0.1, M1.at + 0.5, BB_IN + 0.4, MORPH_BB + 0.5, M2.at + 0.4, DOWN + 0.4, DOWNLOAD + 0.6, FILL1 + 0.15, M3.at + 0.5, SKY_IN + 0.7, DUB + 0.5, POPIN + 0.45, TICK + 0.3,
  M4.at + 0.4, WALL_IN + 0.8, OF + 0.7, M5.at + 0.6, TAKE6 + 0.6, BAR99 + 0.2, L6.end + 0.3, SLAM + 0.3, CLICK + 0.02, SHUT + 0.2, CROWN_OFF + 0.4, SQUINT + 0.3, CUT + 0.6].map(f3);

console.log('  lines ' + TAKES.map((T, i) => (i + 1) + ' ' + T.at.toFixed(2) + '..' + T.end.toFixed(2)).join(', ') + ', cut ' + CUT + ', total ' + f3(CUT + HOLD));
for (const T of TAKES) console.log('  ' + T.name + ': ' + T.all.join(' | '));

await runEpisode({
  post: 59, ep: 0, series: false, title: [],
  cut: CUT, hold: HOLD,
  mascot: MAS,
  voice: TAKES, subs: SUBS, subsAt0: false,
  tp: -1,
  sfx: { cues: CUES, level: -9, duck: 0.6, gains: { whoosh: -21, whooshUp: -21, popDeep: -15, bass: -20, hum: -14, tock: -20, sweep: -30, riser: -24, key: -26, glitch: -20, click: -18, pop: -22 } },
  stills: process.argv.includes('--stills') ? STILLS : null,
  gag: {
    css, markup, front, page, frame, face, camera,
    data: GDATA,
    sleep: [],
    beats: BEATS,
    checks: ['#t1 b', '#t2 b', '#r2 b', '#lab .in', '#lab2 .in', '#bar', '#crown', '#pop', '#bb', '#sky', '#wall'],
    hook: ['#t1 b', '#t2 b', '#r2 b', '#map', '#crown'],
    copy: [T1, T2, R2, ...NAMES.flat(), OFTEXT, WT, '99%', POP_H1, POP_H2, BTN_UP, BTN_RM, CUR_TAG, WALLTXT],
    verify: [
      { at: f3(MORPH_BB + 0.6), sel: '#lab .in', test: r => (r && r.l >= 60 && r.r <= 480 ? null : 'BIG BRAIN leaves the margin: ' + JSON.stringify(r)) },
      { at: f3(DOWNLOAD + 0.8), sel: '#lab .in', test: r => (r && r.l >= 60 && r.r <= 480 ? null : 'DOWNLOAD UNDER leaves the margin: ' + JSON.stringify(r)) },
      { at: f3(TICK + 0.4), sel: '#tick', test: r => (r && r.r <= 480 ? null : 'the tick leaves the margin: ' + JSON.stringify(r)) },
      { at: f3(SLAM + 0.4), sel: '#pop', test: r => (r && r.l >= 60 && r.r <= 480 ? null : 'the popup leaves the margin: ' + JSON.stringify(r)) },
      { at: 0.1, sel: '#crown', test: r => (r && r.t >= 60 ? null : 'the crown is off its spot: ' + JSON.stringify(r)) },
    ],
    log: [[L1.at, 'line 1'], [RIP, 'the ripple'], [AI, 'the title punches'], [ROUND, 'ROUND 2 slams'], [M1.at, 'zoom to london'], [BB_IN, 'big ben rises'], [MORPH_BB, 'BIG BRAIN'],
      [M2.at, 'whip to australia'], [DOWNLOAD, 'DOWNLOAD UNDER'], [FILL1, 'downloaded'], [M3.at, 'whip to the emirates'], [SKY_IN, 'the skyline'], [DUB, 'DUB AI'], [POPIN, 'he pops in'], [AI_GLOW, 'AI goes green'], [TICK, 'the tick'],
      [M4.at, 'glide to china'], [WALL_IN, 'the wall'], [OF, 'OF TEXT'], [M5.at, 'the pull back'], [TAKE6, 'four glow'], [BAR99, '99%'], [L6.end, 'the hush'], [SLAM, 'the popup'], [CLICK, 'remind me tomorrow'],
      [SHUT, 'shut'], [DROP, 'the bar drops'], [CROWN_OFF, 'the crown slides off'], [TURN, 'to the lens'], [CUT, 'the cut']],
  },
});
