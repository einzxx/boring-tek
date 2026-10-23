/* the boring tek — post69. the robot bodyguard, a news reaction on the full
   screen template, lib/fullscreen.mjs, the first with its vision overlay.

   the footage is Unitree's own H2-X promo, demo/assets/unitree-h2x.mp4,
   ignored, never pushed, its sound dropped, credited VIA UNITREE.

   the facts, and only these: Unitree from China released a promo video on
   October 21 2026 of its H2-X humanoid robot, sold as a guardian robot. it
   shows the robot disarming a man with a knife, smashing a car door, lifting
   a car to free a trapped person, and pulling a pedestrian away from a car.
   Unitree did not say if the actions were done by the robot on its own or
   choreographed. the trapped person and the pedestrian are props, Unitree's
   own caption says so, so neither gets a PERSON label, Einz's call.

     frame 0   the hood slam mid dive, ROBOT BODYGUARD mid slam, the dust at 0.3
     l1        china just showed ...  the door smash, the dent on bodyguard
     l2        it stops a man ...     the knife standoff, KNIFE locks on, the
                                      disarm kick in slow motion on knife, the
                                      car lift in interpolated slow motion on
                                      lifts, the pull back frozen on traffic:
                                      the payoff, the green flash, the hit
     l3        but nobody knows ...   AUTONOMY UNKNOWN under ROBOT, the
                                      spinning kick, getting up from under the car
     the door punches held 0.55s, THE BORING TEK, one glitch in, 1.5s, the end

   the source seconds, Unitree's promo: the door 4.4 to 9.6, the hood 10.8 to
   14.2, the knife 35.2 to 38.1, the disarm angle from 38.12, the spin kick
   39.0, the lift 44.5 to 46.6, the gold robot 47.72 to 49.4, the pull back
   50.6 to 51.6, under the car to 54.3, Unitree's end card from 54.4.

     node post69.mjs --takes     read the lines, print the words, stop
     node post69.mjs --stills    one still per beat
     DEMO_FPS=12 node post69.mjs the preview
     node post69.mjs             60fps
*/

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
import { fullscreen } from './lib/fullscreen.mjs';

const DEMO = path.dirname(fileURLToPath(import.meta.url));
const FOOT = path.join(DEMO, 'assets', 'unitree-h2x.mp4');

/* the robot's head, found: its visor glows cyan, so the cyan pixels of the
   footage at 480x270, 10 frames a second, are the head. a frame with fewer
   than 10 is skipped and the keys ease across it. `w`, `h` the head's size
   in the shot, 0..1 of the frame. a box on the head, not the body: a body
   box in a vertical crop is the whole screen, a frame border. it misses
   the lift, where the blue dummy is cyan too, and the gold lit night shots,
   where the visor washes white, so those three are keyed by hand */
function head(src, len, w, h) {
  const W = 480, H = 270, R = 10, n = W * H * 3;
  const raw = execFileSync(ffmpeg, ['-v', 'error', '-ss', String(src), '-i', FOOT, '-t', String(len), '-an',
    '-vf', `fps=${R},scale=${W}:${H}`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 28 });
  const pts = [];
  for (let f = 0; (f + 1) * n <= raw.length; f++) {
    let c = 0, sx = 0, sy = 0;
    for (let i = f * n, k = 0; k < W * H; k++, i += 3) {
      const r = raw[i], g = raw[i + 1], b = raw[i + 2];
      if (b > 120 && g > 80 && b - r > 60 && b + 10 >= g) { c++; sx += k % W; sy += Math.floor(k / W); }
    }
    if (c >= 10) pts.push([src + f / R, sx / c / W, sy / c / H]);
  }
  if (!pts.length) throw new Error('no visor from ' + src + 's');
  /* the raw points, eased between: an average lags a head that moves fast */
  return pts.map(([s, x, y]) => [+s.toFixed(2), +(x - w / 2).toFixed(3), +(y - h * 0.45).toFixed(3), +(x + w / 2).toFixed(3), +(y + h * 0.55).toFixed(3)]);
}
/* by hand, centres off gridded stills of the source */
const box = (w, h, pts) => pts.map(([s, x, y]) => [s, x - w / 2, y - h * 0.45, x + w / 2, y + h * 0.55]);

/* a mark's keys, [source second, l, t, r, b] in 0..1 of the 1920x1080 frame */

await fullscreen({
  post: 69,
  footage: 'assets/unitree-h2x.mp4',
  credit: 'VIA UNITREE',
  sharp: true,
  vision: true,
  lines: [
    '[excited] China just showed a robot bodyguard.',
    '[amused] it stops a man with a knife, lifts a car, and pulls people out of traffic.',
    /* the planned silence, out of the freeze into the doubt */
    { text: '[playful] but nobody knows yet if it did all that by itself.', pause: 0.45 },
  ],
  shots: [
    /* frame 0, the hood slam already moving, the dust at 13.3 lands at 0.3.
       no marks under ROBOT BODYGUARD */
    { at: 0, src: 13.0, focus: [0.48, 0.5] },
    /* the door smash, the knee into the door at 5.15 on bodyguard */
    { at: 'robot', src: 4.74, focus: [[4.74, 0.42, 0.5], [5.0, 0.5, 0.5], [5.15, 0.56, 0.5], [5.81, 0.5, 0.5]], marks: [
      { label: 'ROBOT', keys: head(4.74, 1.1, 0.07, 0.14) },
    ] },
    /* the standoff, him between the knife and her, into the cut at 38.12 */
    { at: 2.2, src: 36.75, focus: [0.55, 0.5], push: 0.02, marks: [
      { label: 'ROBOT', keys: head(36.75, 1.1, 0.045, 0.1) },
      { label: 'KNIFE', keys: [[36.75, 0.628, 0.29, 0.695, 0.41], [36.95, 0.634, 0.31, 0.695, 0.415], [37.15, 0.639, 0.28, 0.7, 0.41], [37.35, 0.623, 0.266, 0.685, 0.38], [37.55, 0.608, 0.275, 0.67, 0.39], [37.75, 0.605, 0.3, 0.67, 0.43], [37.95, 0.618, 0.27, 0.675, 0.39]] },
    ] },
    /* the disarm: down to 0.35 into the kick, the contact at 38.30 on knife.
       held frames, minterpolate tears the kicking leg here */
    { at: 'with', src: 38.14, focus: [0.42, 0.5], ramp: [{ at: 3.6, to: 0.35, over: 0.1 }, { at: 4.05, to: 1, over: 0.15 }], marks: [
      { label: 'ROBOT', keys: head(38.14, 0.75, 0.045, 0.1) },
    ] },
    /* the lift, down to 0.45 as the car comes up, interpolated: it is clean here */
    { at: 'lifts', src: 44.6, focus: [0.48, 0.45], zoom: 1.08, interp: true, ramp: [{ at: 4.7, to: 0.45, over: 0.15 }, { at: 5.3, to: 1, over: 0.15 }], marks: [
      { label: 'ROBOT', keys: box(0.035, 0.08, [[44.6, 0.5, 0.35], [44.7, 0.48, 0.34], [44.9, 0.46, 0.29], [45.1, 0.48, 0.27], [45.3, 0.51, 0.26]]) },
      { label: 'CAR', keys: [[44.6, 0.52, 0.3, 0.6, 0.56], [45.3, 0.52, 0.26, 0.6, 0.52]] },
    ] },
    /* the pull back, frozen at 51.46 on traffic, the pedestrian flung at the
       camera, held into the cut */
    { at: 'pulls', src: 50.7, zoom: 1.08, focus: [[50.7, 0.72, 0.45], [51.0, 0.58, 0.45], [51.25, 0.47, 0.45], [51.46, 0.4, 0.45]], ramp: [{ at: 'traffic', to: 0, over: 0.03 }], marks: [
      { label: 'ROBOT', keys: box(0.035, 0.08, [[50.7, 0.73, 0.35], [50.8, 0.7, 0.33], [51.0, 0.6, 0.29], [51.05, 0.59, 0.29]]) },
    ] },
    /* the gold robot, straight out of the freeze. AUTONOMY UNKNOWN types in on nobody */
    { at: 6.85, src: 47.8, focus: [0.49, 0.45], zoom: 1.08, marks: [
      { label: 'ROBOT', sub: 'AUTONOMY UNKNOWN', subAt: 'nobody', keys: head(47.8, 1.2, 0.075, 0.2) },
    ] },
    /* the spinning kick, flat in the air at 39.16 */
    { at: 'knows', src: 38.95, focus: [0.5, 0.45], marks: [
      { label: 'ROBOT', sub: 'AUTONOMY UNKNOWN', subAt: 'nobody', keys: head(38.95, 0.85, 0.06, 0.12) },
    ] },
    /* up from under the car, out before Unitree's end card at 54.4 */
    { at: 'did', src: 53.62, focus: [0.52, 0.5], marks: [
      { label: 'ROBOT', sub: 'AUTONOMY UNKNOWN', subAt: 'nobody', keys: box(0.05, 0.11, [[53.7, 0.44, 0.48], [53.9, 0.45, 0.26], [54.1, 0.48, 0.14], [54.28, 0.48, 0.14]]) },
      { label: 'CAR', keys: [[53.62, 0.32, 0.45, 0.55, 0.72], [54.28, 0.32, 0.45, 0.55, 0.72]] },
    ] },
    /* the door again, later frames: the knee into it at 7.95 */
    { at: 'itself', src: 7.6, focus: [0.48, 0.5], marks: [
      { label: 'ROBOT', sub: 'AUTONOMY UNKNOWN', subAt: 'nobody', keys: head(7.6, 1.1, 0.07, 0.14) },
    ] },
  ],
  punches: [{ at: 'man', by: 0.08 }, { at: 'nobody', by: 0.1, focus: [0.5, 0.2] }],
  big: [{ at: 0, lines: ['ROBOT', 'BODYGUARD'], hold: 1.05 }],
  payoff: 'traffic',
  shake: [{ at: 0.3 }, { at: 'bodyguard', amp: 5 }, { at: 'knife', amp: 6 }, { at: 'car', amp: 4 }, { at: 'traffic', amp: 7 }, { at: 9.95 }],
  /* the door punches read before the glitch */
  hold: 0.55,
  kit: {
    metal: ['mixkit-2980-factory-metal-hard-hit.mp3', -13, 0.02],
    click: ['mixkit-2364-hard-pop-click.mp3', -16, 0.01],
    drypop: ['mixkit-2356-dry-pop-up-notification-alert.mp3', -17, 0.01],
  },
  sounds: [
    { at: 0.3, kind: 'metal', from: 'the hood slam, the dust' },
    { at: 'bodyguard', kind: 'metal', from: 'the knee dents the door' },
    { at: 2.4, kind: 'click', from: 'KNIFE locks on' },
    { at: 3.7, kind: 'arrowwhoosh', from: 'the kick swings up' },
    { at: 'knife', kind: 'thud', from: 'the kick meets the knife arm' },
    { at: 'car', kind: 'basshit', from: 'the car comes up' },
    { at: 'traffic', kind: 'thud', from: 'the freeze, under the payoff hit' },
    { at: 'nobody', kind: 'drypop', from: 'AUTONOMY UNKNOWN types in' },
    { at: 8.32, kind: 'arrowwhoosh', from: 'the spin kick, flat in the air' },
    { at: 9.95, kind: 'thud', from: 'the knee into the door' },
    { at: 9.95, kind: 'metal', from: 'the door dents' },
  ],
  /* no mascot in this clip, Einz's call 2026-10-23: the robot is the star,
     the wordmark and the card carry the brand */
  mascot: null,
});
