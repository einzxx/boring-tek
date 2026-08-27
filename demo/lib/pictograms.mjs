/* the boring tek — animated pictogram scenes. svg drawn in code, driven per
   frame, on the same rig everything else in demo/ runs on.

   what this is. a scene layer for the clips. it takes a list of scenes, each a
   list of flat shapes with a time on them, and turns it into markup plus a pure
   function of time. `lib/captions.mjs` does exactly this for words; this does
   it for pictures, and the two are deliberately built the same way so a clip
   drives both from one loop.

   the one rule, again, because it is the rule that shapes the file: **no css
   transition, no css animation, on anything that has to hit a mark.** one
   captured frame carries five or six BeginFrames, so a css animation resolves
   about five times too fast. every moving value in here is eased in javascript,
   in node, and written to the element per frame. `sceneFrame(plan, t)` is the
   whole animation and it is a pure function of time.

   ---------- what a scene is ----------

   a scene is a group with an entrance, a hold and an exit, and inside it a list
   of parts. a part is one shape and a list of steps, and a step is one of five
   kinds:

     pop    a scale spring about the shape's own centre, with a fade
     draw   stroke dashoffset line drawing, along the path
     move   a translate from an offset, with or without a fade
     flip   a rotate and a scale, in or out, for one thing becoming another
     fade   opacity alone

   steps are a list rather than a single animation because real objects do more
   than one thing: a lock's shackle is drawn and *then* seats, which is two
   steps on one part and is the difference between a lock appearing and a lock
   closing. each step owns the channels it moves and leaves the rest alone, so
   two steps on one part never fight over the same number.

   ---------- what is fixed ----------

   the colours, which are the page's own tokens and nothing else: --fg for ink,
   --muted for the secondary lines inside a sheet, --accent for the one thing a
   scene is about, --red for an error and nothing else, --face and --eye for the
   mascot. there is no text in a pictogram and there is no third colour.

   the geometry is a 100x60 viewBox scaled into whatever box the caller hands
   over, so every number in a scene is in the same units and a shape that reads
   at one size reads at all of them.

   ---------- who checks what ----------

   `planScenes` refuses a plan that cannot be drawn cleanly: a part that starts
   before its own scene has finished arriving, a part still animating while its
   scene leaves, three scenes on screen at once. `sceneMotion` walks every frame
   before a render and reports the biggest one frame step in every channel, so a
   snap is caught in a second rather than after twenty two seconds of jpegs. the
   clip script turns those numbers into guards.
*/

/* ---------- easing ----------
   the same solver captions.mjs and every post script carries, so a pictogram
   moves on the curves the site moves on rather than on a lookalike. */
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const fx = t => ((ax * t + bx) * t + cx) * t;
  const dfx = t => (3 * ax * t + 2 * bx) * t + cx;
  const fy = t => ((ay * t + by) * t + cy) * t;
  return x => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 6; i++) {
      const e = fx(t) - x, d = dfx(t);
      if (Math.abs(e) < 1e-6) return fy(t);
      if (Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    let lo = 0, hi = 1; t = x;
    for (let i = 0; i < 30; i++) {
      const e = fx(t) - x;
      if (Math.abs(e) < 1e-6) break;
      if (e > 0) hi = t; else lo = t;
      t = (lo + hi) / 2;
    }
    return fy(t);
  };
}
/* the house curves. SPRING is the site's own --spring and it is the only thing
   in here that overshoots — once, never twice. EASE_IO carries every opacity
   ramp in the file, deliberately: the site's --ease leaves zero with a slope of
   6.25, so a fade on it steps a third of the way in one frame at 60fps, which
   is a flash rather than a fade. FALL is for the one thing that falls. */
const SPRING = bezier(.34, 1.4, .64, 1);
const EASE_IO = bezier(.45, 0, .55, 1);
const FALL = bezier(.5, 0, .28, 1);
const EASES = { io: EASE_IO, spring: SPRING, fall: FALL };
const lerp = (a, b, p) => a + (b - a) * p;
const span = (t, a, b) => (b <= a ? (t >= b ? 1 : 0) : Math.max(0, Math.min(1, (t - a) / (b - a))));
const n = v => Math.round(v * 1000) / 1000;

/* ---------- the step defaults ----------
   the durations are floors as much as they are defaults. the opacity ones in
   particular: a fade shorter than about a fifth of a second cannot be told from
   a cut at 60fps, and `planScenes` says so in a number rather than in an
   opinion. */
export const STEP_DEFAULTS = {
  pop: { for: 0.34, fade: 0.24, from: 0.58 },
  draw: { for: 0.50, fade: 0.22 },
  move: { for: 0.44, fade: 0.24, ease: 'io', from: [0, 0], fadeIn: true },
  flip: { for: 0.36, fade: 0.28, rot: 70, from: 0.45, dir: 'in' },
  fade: { for: 0.26, to: 1 },
};
export const SCENE_ENTER = { for: 0.40, fade: 0.34, scale: 0.90, dx: 0, dy: 9 };
export const SCENE_EXITS = {
  springOut: { for: 0.30, fade: 0.30, scale: 0.90, dx: 0, dy: 7 },
  slideUp: { for: 0.30, fade: 0.30, scale: 1, dx: 0, dy: -16 },
  slideLeft: { for: 0.30, fade: 0.30, scale: 1, dx: -22, dy: 0 },
};
/* the mascot's own ratios, off the 64 grid in skills/page-builder/SKILL.md, so
   a small face in a closing scene is provably the same face rather than one
   drawn by eye. */
export const MASCOT_RATIO = { eyeW: 0.217, eyeH: 0.073, sep: 0.35, drop: 0.108 };

/* ---------- the shape vocabulary ----------
   flat, minimal, stroked. each returns the markup and the shape's own centre,
   which is the origin every scale and every rotate happens about — a shape that
   sprang about the viewBox centre instead of its own would swim across the
   frame on the way in.

   a shape that can be line drawn puts the class `pic-line` on the one geometry
   element the dash runs along, and there is never more than one: a dash across
   a subpath boundary is not the same thing in every engine, so a two stroke
   mark like an x is two parts that draw in turn, which reads better anyway. */
export const SHAPES = {
  /* an empty square. a list waiting. */
  square: ({ cx, cy, s }) => ({
    o: [cx, cy],
    svg: `<rect class="pic-line" x="${n(cx - s / 2)}" y="${n(cy - s / 2)}" width="${n(s)}" height="${n(s)}" rx="1"/>`,
  }),
  /* a document. */
  sheet: ({ x, y, w, h, r = 1.4 }) => ({
    o: [x + w / 2, y + h / 2],
    svg: `<rect class="pic-line" x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${n(r)}"/>`,
  }),
  /* a line of writing inside one. always --muted: it is texture, not content,
     and at this size real words would be a smudge. */
  rule: ({ x1, x2, y }) => ({
    o: [(x1 + x2) / 2, y],
    svg: `<line class="pic-line" x1="${n(x1)}" y1="${n(y)}" x2="${n(x2)}" y2="${n(y)}"/>`,
  }),
  /* a signature. one path, hand shaped rather than generated off a sine, so the
     loops are uneven the way a real one is. */
  squiggle: ({ x1, x2, y, a = 3.2 }) => {
    const w = x2 - x1, X = k => n(x1 + w * k), Y = k => n(y + a * k);
    return {
      o: [(x1 + x2) / 2, y],
      svg: `<path class="pic-line" d="M ${n(x1)} ${n(y)}`
        + ` C ${X(.10)} ${Y(-1.1)} ${X(.16)} ${Y(1.0)} ${X(.28)} ${Y(.25)}`
        + ` C ${X(.38)} ${Y(-.6)} ${X(.30)} ${Y(-1.3)} ${X(.44)} ${Y(-1.0)}`
        + ` C ${X(.56)} ${Y(-.7)} ${X(.50)} ${Y(1.1)} ${X(.62)} ${Y(.6)}`
        + ` C ${X(.74)} ${Y(.1)} ${X(.70)} ${Y(-1.2)} ${X(.84)} ${Y(-.8)}`
        + ` C ${X(.92)} ${Y(-.5)} ${X(.96)} ${Y(.3)} ${n(x2)} ${Y(-.2)}"/>`,
    };
  },
  /* a coin. two concentric circles, which is the least a coin can be and still
     not read as a full stop. it was a circle with a bar across it first and the
     bar read as a minus sign, which is a different thing entirely and the sort
     of wrongness that only shows up once it is on the frame. */
  coin: ({ cx, cy, r }) => ({
    o: [cx, cy],
    svg: `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}"/>`
      + `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r * .56)}"/>`,
  }),
  /* a person. a head and a pair of shoulders. no body, no arms, no face: the
     one face in this vocabulary is the mascot's and it stays that way. */
  human: ({ cx, cy, r, sw, sh }) => ({
    o: [cx, cy + (r + sh) / 2],
    svg: `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}"/>`
      + `<path d="M ${n(cx - sw / 2)} ${n(cy + r + sh)} Q ${n(cx)} ${n(cy + r - 2)} ${n(cx + sw / 2)} ${n(cy + r + sh)}"/>`,
  }),
  /* the mark. */
  check: ({ cx, cy, s }) => ({
    o: [cx, cy],
    svg: `<path class="pic-line" d="M ${n(cx - s * .44)} ${n(cy + s * .02)}`
      + ` L ${n(cx - s * .12)} ${n(cy + s * .34)} L ${n(cx + s * .46)} ${n(cy - s * .36)}"/>`,
  }),
  /* one straight stroke. two of these make an x, drawn in turn. also the slash
     through an eye and the line between two figures. */
  stroke: ({ x1, y1, x2, y2 }) => ({
    o: [(x1 + x2) / 2, (y1 + y2) / 2],
    svg: `<line class="pic-line" x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}"/>`,
  }),
  /* a folder. the tab is the whole read, so it is a real corner rather than a
     rounded suggestion of one. */
  folder: ({ x, y, w, h, tab = 5 }) => ({
    o: [x + w / 2, y + h / 2],
    svg: `<path class="pic-line" d="M ${n(x)} ${n(y + h)} L ${n(x)} ${n(y)} L ${n(x + w * .38)} ${n(y)}`
      + ` L ${n(x + w * .47)} ${n(y + tab)} L ${n(x + w)} ${n(y + tab)} L ${n(x + w)} ${n(y + h)} Z"/>`,
  }),
  /* a padlock body. */
  lockBody: ({ cx, cy, w, h }) => ({
    o: [cx, cy],
    svg: `<rect x="${n(cx - w / 2)}" y="${n(cy - h / 2)}" width="${n(w)}" height="${n(h)}" rx="1.4"/>`,
  }),
  /* its shackle, open at the bottom, drawn left to right over the top. */
  shackle: ({ cx, cy, r }) => ({
    o: [cx, cy],
    svg: `<path class="pic-line" d="M ${n(cx - r)} ${n(cy)} A ${n(r)} ${n(r)} 0 0 1 ${n(cx + r)} ${n(cy)}"/>`,
  }),
  /* an eye. a lens and a pupil, and the pupil is the one filled thing in the
     vocabulary that is not the mascot. */
  eye: ({ cx, cy, w, h, pr }) => ({
    o: [cx, cy],
    svg: `<path d="M ${n(cx - w / 2)} ${n(cy)} Q ${n(cx)} ${n(cy - h)} ${n(cx + w / 2)} ${n(cy)}`
      + ` Q ${n(cx)} ${n(cy + h)} ${n(cx - w / 2)} ${n(cy)} Z"/>`
      + `<circle class="pic-fill" cx="${n(cx)}" cy="${n(cy)}" r="${n(pr)}"/>`,
  }),
  /* a magnifying glass, handle down and to the right. */
  magnifier: ({ cx, cy, r, hl }) => {
    const c = Math.SQRT1_2;
    return {
      o: [cx, cy],
      svg: `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}"/>`
        + `<line x1="${n(cx + r * c)}" y1="${n(cy + r * c)}" x2="${n(cx + (r + hl) * c)}" y2="${n(cy + (r + hl) * c)}"/>`,
    };
  },
  /* the mascot, small. drawn from the ratios rather than by eye, and it carries
     --face and --eye, so it inverts with the theme exactly as the real one does
     and reads as a hole punched in the page rather than as an illustration
     sitting on it. the eyes carry `pic-blink` and the clip drives them from the
     same lid it drives the real mascot with, because two faces on one screen
     must not disagree about blinking. */
  mascotFace: ({ cx, cy, r }) => {
    const d = r * 2, R = MASCOT_RATIO;
    const ew = d * R.eyeW, eh = d * R.eyeH, sep = d * R.sep, drop = d * R.drop;
    const ey = cy + drop - eh / 2;
    const rect = ox => `<rect class="pic-blink" x="${n(cx + ox - ew / 2)}" y="${n(ey)}"`
      + ` width="${n(ew)}" height="${n(eh)}" rx="${n(eh / 2)}" fill="var(--eye)" stroke="none"/>`;
    return {
      o: [cx, cy],
      svg: `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="var(--face)" stroke="none"/>`
        + rect(-sep / 2) + rect(sep / 2),
    };
  },
};

const INKS = ['fg', 'muted', 'accent', 'red', 'face'];

/* ---------- the plan ----------
   scenes in, a driveable plan out. everything this refuses is something that
   would otherwise have shipped as a glitch. */
export function planScenes(scenes, opts = {}) {
  const viewBox = opts.viewBox || [100, 60];
  if (!Array.isArray(scenes) || !scenes.length) throw new Error('a scene layer needs scenes');

  const out = [], parts = [], notes = [];
  let last = null;

  scenes.forEach((sc, i) => {
    if (!(sc.out > sc.in)) throw new Error('scene "' + sc.id + '" ends before it starts');
    const enter = { ...SCENE_ENTER, ...(sc.enterOpts || {}) };
    if (sc.exit && !SCENE_EXITS[sc.exit]) {
      throw new Error('scene "' + sc.id + '" exits by "' + sc.exit + '", which is one of '
        + Object.keys(SCENE_EXITS).join(', '));
    }
    const exit = sc.exit ? { kind: sc.exit, ...SCENE_EXITS[sc.exit] } : null;
    const settled = sc.in + Math.max(enter.for, enter.fade);
    const leaving = exit ? sc.out - exit.for : sc.out;
    if (leaving < settled + 0.05) {
      throw new Error('scene "' + sc.id + '" starts leaving at ' + leaving.toFixed(2)
        + 's and is not finished arriving until ' + settled.toFixed(2) + 's — it never holds still');
    }
    if (last) {
      if (sc.in < last.in) throw new Error('the scenes are not in time order at "' + sc.id + '"');
      const overlap = +(last.out - sc.in).toFixed(3);
      if (overlap > 0.45) {
        throw new Error('"' + last.id + '" and "' + sc.id + '" overlap for ' + overlap.toFixed(2)
          + 's — a handoff is a handoff, not a dissolve');
      }
      if (overlap < -0.02) {
        notes.push('a ' + (-overlap).toFixed(2) + 's hole between "' + last.id
          + '" and "' + sc.id + '" with nothing in the zone');
      }
      if (out.length > 1 && sc.in < out[out.length - 2].out) {
        throw new Error('three scenes are on screen at once around ' + sc.in.toFixed(2) + 's');
      }
    }

    const seen = new Set();
    const idx = [];
    (sc.parts || []).forEach(p => {
      if (!SHAPES[p.shape]) throw new Error('no shape called "' + p.shape + '"');
      if (seen.has(p.id)) throw new Error('two parts called "' + p.id + '" in scene "' + sc.id + '"');
      seen.add(p.id);
      if (p.ink && !INKS.includes(p.ink)) {
        throw new Error('"' + p.id + '" is inked ' + p.ink + ', which is not one of ' + INKS.join(', '));
      }
      const shape = SHAPES[p.shape](p.at || {});
      const steps = (Array.isArray(p.steps) ? p.steps : [p.steps]).map(raw => {
        const d = STEP_DEFAULTS[raw.kind];
        if (!d) throw new Error('"' + p.id + '" has a step of kind "' + raw.kind + '"');
        const s = { ...d, ...raw };
        if (!(s.t >= 0) || !(s.for > 0)) throw new Error('"' + p.id + '" has a step with no time');
        /* a part must not begin before its own scene has mostly arrived, and it
           must be finished before the scene starts leaving. both of those read
           as the layer glitching rather than as a wrong number, which is why
           they throw here instead of being printed. */
        if (s.t < sc.in + enter.for * 0.5 - 1e-6) {
          throw new Error('"' + p.id + '" starts at ' + s.t.toFixed(2)
            + 's, before scene "' + sc.id + '" has arrived');
        }
        if (s.t + s.for > leaving + 1e-6) {
          throw new Error('"' + p.id + '" is still moving at ' + (s.t + s.for).toFixed(2)
            + 's and scene "' + sc.id + '" starts leaving at ' + leaving.toFixed(2) + 's');
        }
        if (s.kind !== 'draw' && s.fade && s.fade < 0.20) {
          notes.push('"' + p.id + '" fades in ' + s.fade.toFixed(2)
            + 's, under the 0.20s a fade needs to read as one at 60fps');
        }
        return s;
      }).sort((a, b) => a.t - b.t);
      idx.push(parts.length);
      parts.push({
        i: parts.length, scene: i, id: p.id, shape: p.shape,
        o: [n(shape.o[0]), n(shape.o[1])],
        ink: p.ink || 'fg', w: p.w == null ? 1.2 : p.w,
        draw: steps.some(s => s.kind === 'draw'),
        blink: p.shape === 'mascotFace',
        svg: shape.svg, steps,
      });
    });
    if (!idx.length) throw new Error('scene "' + sc.id + '" has no parts');

    out.push({
      i, id: sc.id, in: +sc.in.toFixed(3), out: +sc.out.toFixed(3),
      enter, exit, settled: +settled.toFixed(3), leaving: +leaving.toFixed(3), parts: idx,
    });
    last = out[out.length - 1];
  });

  return {
    viewBox, origin: [viewBox[0] / 2, viewBox[1] / 2],
    scenes: out, parts, notes,
    seconds: +Math.max(...out.map(s => s.out)).toFixed(3),
  };
}

/* ---------- the animation ----------
   a pure function of time. every number a frame needs comes out of here and
   nothing in the page decides anything.

   the shape of the return matches captions.mjs's on purpose:
     s[i] = [opacity, scale, dx, dy]                for each scene group
     p[i] = [opacity, scale, dx, dy, rot, dash]     for each part
   translations and the origin are in viewBox units, rot in degrees, dash is the
   fraction of the path that is drawn.

   every part holds a value at every instant of the clip, including long before
   and long after its own steps. that is the whole reason the movement guards
   can run unconditionally: nothing in the layer ever teleports while invisible
   and reappears somewhere else. */
export function sceneFrame(plan, t, env = {}) {
  const blink = env.blink == null ? 1 : env.blink;

  const s = plan.scenes.map(sc => {
    const E = sc.enter, X = sc.exit;
    if (t < sc.in) return [0, E.scale, E.dx, E.dy];
    if (t < sc.settled) {
      const q = span(t, sc.in, sc.in + E.for);
      return [EASE_IO(span(t, sc.in, sc.in + E.fade)),
        lerp(E.scale, 1, SPRING(q)), lerp(E.dx, 0, EASE_IO(q)), lerp(E.dy, 0, EASE_IO(q))];
    }
    if (!X || t < sc.leaving) return [1, 1, 0, 0];
    if (t >= sc.out) return [0, X.scale, X.dx, X.dy];
    const q = span(t, sc.leaving, sc.out);
    return [1 - EASE_IO(span(t, sc.leaving, sc.leaving + X.fade)),
      lerp(1, X.scale, EASE_IO(q)), lerp(0, X.dx, EASE_IO(q)), lerp(0, X.dy, EASE_IO(q))];
  });

  const p = plan.parts.map(part => {
    let o = 0, sc = 1, dx = 0, dy = 0, rot = 0, dash = part.draw ? 0 : 1;
    for (const st of part.steps) {
      if (st.kind === 'pop') {
        if (t < st.t) { o = 0; sc = st.from; }
        else {
          o = EASE_IO(span(t, st.t, st.t + st.fade));
          sc = lerp(st.from, 1, SPRING(span(t, st.t, st.t + st.for)));
        }
      } else if (st.kind === 'draw') {
        if (t < st.t) { o = 0; dash = 0; }
        else {
          o = EASE_IO(span(t, st.t, st.t + st.fade));
          dash = EASE_IO(span(t, st.t, st.t + st.for));
        }
      } else if (st.kind === 'move') {
        const e = EASES[st.ease] || EASE_IO;
        if (t < st.t) {
          dx = st.from[0]; dy = st.from[1];
          if (st.fadeIn) o = 0;
        } else {
          const q = e(span(t, st.t, st.t + st.for));
          dx = lerp(st.from[0], 0, q); dy = lerp(st.from[1], 0, q);
          if (st.fadeIn) o = EASE_IO(span(t, st.t, st.t + st.fade));
        }
      } else if (st.kind === 'flip') {
        const leaving = st.dir === 'out';
        if (t < st.t) {
          /* on the way in the part is not there yet and waits at the far side of
             its own turn. on the way out it is already drawn and whatever the
             step before it left behind is exactly right, so nothing is written
             here — writing anything would be the snap. */
          if (!leaving) { o = 0; sc = st.from; rot = st.rot; }
        } else {
          const q = EASE_IO(span(t, st.t, st.t + st.for));
          const f = EASE_IO(span(t, st.t, st.t + st.fade));
          if (leaving) { o = 1 - f; sc = lerp(1, st.from, q); rot = lerp(0, st.rot, q); }
          else { o = f; sc = lerp(st.from, 1, q); rot = lerp(st.rot, 0, q); }
        }
      } else {
        const to = st.to == null ? 1 : st.to;
        if (t < st.t) o = to === 0 ? 1 : 0;
        else { const f = EASE_IO(span(t, st.t, st.t + st.for)); o = to === 0 ? 1 - f : f; }
      }
    }
    return [o, sc, dx, dy, rot, dash];
  });

  return { t: +t.toFixed(4), s, p, blink };
}

/* ---------- the preflight ----------
   walks every frame of the clip through `sceneFrame` and reports the biggest
   one frame step in every channel, plus who made it. it costs a fraction of a
   second and it is the difference between finding a snap now and finding it in
   a twenty two second render.

   the blink is not measured here: the clip drives it with the same lid it
   drives the real mascot with, and that one is already guarded where it is
   generated. measuring it twice would only invite the two limits to drift. */
export function sceneMotion(plan, fps, seconds) {
  const N = Math.round(fps * seconds);
  const worst = {
    sceneO: { d: 0, t: 0, who: null }, sceneS: { d: 0, t: 0, who: null }, sceneM: { d: 0, t: 0, who: null },
    partO: { d: 0, t: 0, who: null }, partS: { d: 0, t: 0, who: null }, partM: { d: 0, t: 0, who: null },
    partR: { d: 0, t: 0, who: null }, partD: { d: 0, t: 0, who: null },
  };
  const bump = (k, d, t, who) => { if (d > worst[k].d) worst[k] = { d: +d.toFixed(4), t: +t.toFixed(3), who }; };

  let prev = null, visMax = 0, dark = 0, twoFrom = null;
  const handoffs = [];
  for (let f = 0; f < N; f++) {
    const t = f / fps;
    const fr = sceneFrame(plan, t);
    const vis = fr.s.filter(v => v[0] >= 0.004).length;
    visMax = Math.max(visMax, vis);
    if (!vis) dark++;
    if (vis > 1 && twoFrom === null) twoFrom = t;
    if (vis <= 1 && twoFrom !== null) { handoffs.push([+twoFrom.toFixed(3), +t.toFixed(3)]); twoFrom = null; }
    if (prev) {
      for (let i = 0; i < fr.s.length; i++) {
        const a = prev.s[i], b = fr.s[i], who = plan.scenes[i].id;
        bump('sceneO', Math.abs(b[0] - a[0]), t, who);
        bump('sceneS', Math.abs(b[1] - a[1]), t, who);
        bump('sceneM', Math.hypot(b[2] - a[2], b[3] - a[3]), t, who);
      }
      for (let i = 0; i < fr.p.length; i++) {
        const a = prev.p[i], b = fr.p[i], who = plan.parts[i].id;
        bump('partO', Math.abs(b[0] - a[0]), t, who);
        bump('partS', Math.abs(b[1] - a[1]), t, who);
        bump('partM', Math.hypot(b[2] - a[2], b[3] - a[3]), t, who);
        bump('partR', Math.abs(b[4] - a[4]), t, who);
        bump('partD', Math.abs(b[5] - a[5]), t, who);
      }
    }
    prev = fr;
  }
  if (twoFrom !== null) handoffs.push([+twoFrom.toFixed(3), +(N / fps).toFixed(3)]);
  return { frames: N, visMax, dark: +(dark / fps).toFixed(3), handoffs, worst };
}

/* ---------- the css ----------
   no transition and no animation anywhere in here, on purpose. the only things
   this file styles are colour, weight and the box, and every one of them is a
   page token. */
export function pictogramCss(plan, box) {
  return `
/* the scene zone. the upper third of the frame, above the caption box and below
   the safe margin, and it never draws outside itself: the svg clips to its own
   viewBox, so a coin dropping in from above the block is cut at the block's
   edge rather than running loose over the whole frame. */
.pic{
  position:absolute;
  left:${box.x}px; top:${box.y}px; width:${box.w}px; height:${box.h}px;
  pointer-events:none; z-index:3;
}
.pic svg{display:block; width:100%; height:100%; overflow:hidden}
/* the resting state is invisible, so a frame captured before the first rAF tick
   cannot show a whole scene sitting there fully drawn. every frame after that
   is written by apply(). */
.pic-s{opacity:0; will-change:opacity,transform}
.pic-p{
  fill:none; stroke-linecap:round; stroke-linejoin:round;
  will-change:opacity,transform;
}
/* one ink per part, and every one of them is a token out of index.html. --red
   is the site's own error colour and it means the same thing here: something is
   wrong, briefly, until it is not. */
.pic-p[data-ink="fg"]{color:var(--fg); stroke:var(--fg)}
.pic-p[data-ink="muted"]{color:var(--muted); stroke:var(--muted)}
.pic-p[data-ink="accent"]{color:var(--accent); stroke:var(--accent)}
.pic-p[data-ink="red"]{color:var(--red); stroke:var(--red)}
.pic-p[data-ink="face"]{color:var(--face); stroke:none}
.pic-p .pic-fill{fill:currentColor; stroke:none}
/* the small mascot's lids, scaled about their own centre exactly as the real
   mascot's are on the page. */
.pic-blink{transform-box:fill-box; transform-origin:center}
`;
}

/* ---------- markup ----------
   built from the plan alone, so the dom order is the parts' order and the page
   can write by index without ever querying by name. */
export function pictogramMarkup(plan) {
  const body = plan.scenes.map(sc => '<g class="pic-s" data-scene="' + sc.i + '">'
    + sc.parts.map(pi => {
      const p = plan.parts[pi];
      return '<g class="pic-p" data-part="' + p.i + '" data-ink="' + p.ink
        + '" stroke-width="' + n(p.w) + '">' + p.svg + '</g>';
    }).join('')
    + '</g>').join('');
  return '<div class="pic"><svg viewBox="0 0 ' + plan.viewBox[0] + ' ' + plan.viewBox[1]
    + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">'
    + body + '</svg></div>';
}

/* ---------- the page half ----------
   serialised into the scene with .toString(), the way captionPage is. it
   measures the path lengths once and then does as it is told: `draw` writes
   numbers, it never computes one.

   the one thing it does on its own is run: `set()` leaves a frame for the rAF
   loop and the loop applies it, so the layer is genuinely on the shim's clock
   rather than being written straight into the dom from node. the recorder
   flushes exactly one rAF per captured frame, which makes that one tick and one
   frame, always. */
export function pictogramPage() {
  const PLAN = window.__PIC_PLAN;
  const scenes = [];
  document.querySelectorAll('.pic-s').forEach(el => { scenes[+el.dataset.scene] = el; });
  const parts = [];
  document.querySelectorAll('.pic-p').forEach(el => { parts[+el.dataset.part] = el; });
  const lids = [...document.querySelectorAll('.pic-blink')];
  const lens = [];

  /* the origin sandwich, written out rather than left to transform-box: a
     translate in an svg is in user units, so this is exact at any scale and it
     does not depend on which box a browser thinks the reference is. */
  function tf(ox, oy, dx, dy, rot, s) {
    let out = '';
    if (dx || dy) out += 'translate(' + dx.toFixed(3) + 'px,' + dy.toFixed(3) + 'px) ';
    if (rot || s !== 1) {
      out += 'translate(' + ox.toFixed(3) + 'px,' + oy.toFixed(3) + 'px) ';
      if (rot) out += 'rotate(' + rot.toFixed(3) + 'deg) ';
      if (s !== 1) out += 'scale(' + s.toFixed(4) + ') ';
      out += 'translate(' + (-ox).toFixed(3) + 'px,' + (-oy).toFixed(3) + 'px)';
    }
    return out.trim();
  }

  window.__pic = {
    ready: false,
    pending: null,
    ticks: 0,
    last: null,
    build() {
      for (let i = 0; i < PLAN.parts.length; i++) {
        if (!PLAN.parts[i].draw) { lens[i] = 0; continue; }
        const g = parts[i].querySelector('.pic-line');
        if (!g) throw new Error('part "' + PLAN.parts[i].id + '" draws but has no pic-line');
        const L = g.getTotalLength();
        lens[i] = L;
        g.style.strokeDasharray = L.toFixed(3);
        g.style.strokeDashoffset = L.toFixed(3);
      }
      this.ready = true;
      return {
        scenes: scenes.length, parts: parts.length, lids: lids.length,
        drawn: PLAN.parts.filter(p => p.draw).length,
        lengths: lens.map(v => +v.toFixed(2)),
      };
    },
    /* node leaves a frame here and the rAF loop picks it up. */
    set(f) { this.pending = f; },
    apply(f) {
      let vis = 0, sum = 0;
      for (let i = 0; i < scenes.length; i++) {
        const a = f.s[i], el = scenes[i];
        el.style.opacity = a[0].toFixed(4);
        el.style.transform = tf(PLAN.origin[0], PLAN.origin[1], a[2], a[3], 0, a[1]);
        el.style.visibility = a[0] < 0.004 ? 'hidden' : 'visible';
        if (a[0] >= 0.004) vis++;
        sum += a[0] + a[1] + a[2] + a[3];
      }
      for (let i = 0; i < parts.length; i++) {
        const a = f.p[i], el = parts[i], p = PLAN.parts[i];
        el.style.opacity = a[0].toFixed(4);
        el.style.transform = tf(p.o[0], p.o[1], a[2], a[3], a[4], a[1]);
        /* inherit, never "visible": a part that said visible out loud would
           un-hide itself inside a scene group that is hidden. */
        el.style.visibility = a[0] < 0.004 ? 'hidden' : 'inherit';
        if (p.draw) {
          el.querySelector('.pic-line').style.strokeDashoffset = (lens[i] * (1 - a[5])).toFixed(3);
        }
        sum += a[0] + a[1] + a[2] + a[3] + a[4] + a[5];
      }
      for (const e of lids) e.style.transform = 'scaleY(' + f.blink.toFixed(4) + ')';
      this.ticks++;
      this.last = { t: f.t, vis: vis, sum: +sum.toFixed(4), blink: +f.blink.toFixed(4), ticks: this.ticks };
      return this.last;
    },
    /* how close the nearest visible pictogram ink gets to each border, in css
       px, and how far down the zone the lowest ink reaches. measured off drawn
       elements rather than off the box, because the box is where the layer was
       told to live and this is where it actually drew. */
    safe(vw, vh) {
      let left = 1e9, top = 1e9, right = 1e9, bottom = 1e9, low = -1e9, worst = null, which = null;
      for (const el of parts) {
        if (!el) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden') continue;
        let o = 1, node = el;
        while (node && node !== document.body) {
          o *= parseFloat(getComputedStyle(node).opacity || '1');
          node = node.parentElement;
        }
        if (o < 0.02) continue;
        const b = el.getBoundingClientRect();
        if (!b.width && !b.height) continue;
        const d = [b.left, b.top, vw - b.right, vh - b.bottom];
        if (Math.min.apply(null, d) < Math.min(left, top, right, bottom)) {
          worst = 'pic:' + PLAN.parts[+el.dataset.part].id;
        }
        left = Math.min(left, d[0]); top = Math.min(top, d[1]);
        right = Math.min(right, d[2]); bottom = Math.min(bottom, d[3]);
        if (b.bottom > low) { low = b.bottom; which = PLAN.parts[+el.dataset.part].id; }
      }
      if (worst === null) return null;
      return { left: left, top: top, right: right, bottom: bottom, worst: worst,
        low: +low.toFixed(1), lowest: which };
    },
  };

  /* one rAF loop, re-registering at the top so the shim always has exactly one
     callback queued and one flush is one frame. */
  function loop() {
    requestAnimationFrame(loop);
    const f = window.__pic.pending;
    if (f) { window.__pic.pending = null; window.__pic.apply(f); }
  }
  requestAnimationFrame(loop);
}

/* ---------- a printable summary ----------
   the plan as a card for the terminal, so a cut can be read before three
   minutes are spent on frames. */
export function describeScenes(plan) {
  const out = [];
  out.push('  ' + plan.scenes.length + ' scenes, ' + plan.parts.length + ' parts, '
    + plan.parts.filter(p => p.draw).length + ' of them line drawn, '
    + plan.seconds.toFixed(2) + 's of scene');
  for (const sc of plan.scenes) {
    out.push('    ' + sc.in.toFixed(2).padStart(5) + '..' + sc.out.toFixed(2).padStart(5)
      + '  ' + sc.id + (sc.exit ? ' (' + sc.exit.kind + ')' : ' (holds)'));
    for (const pi of sc.parts) {
      const p = plan.parts[pi];
      out.push('        ' + p.steps.map(s => s.t.toFixed(2)).join('/').padStart(11)
        + '  ' + p.id.padEnd(12) + p.steps.map(s => s.kind).join(' then ')
        + '  [' + p.ink + ']');
    }
  }
  for (const note of plan.notes) out.push('    note: ' + note);
  return out.join('\n');
}
