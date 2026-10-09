/* lab kit: the frame grid and the mascot markup, shared by build.mjs and the scenes */
import { HEAD, EYE_CX, GRID } from '../../lib/mascot.mjs';
export const FPS = 60, TOTAL = 300;

/* ---------- the mascot, from lib/mascot.mjs geometry ----------
   #id         placed by the scene (translate)
   #id-sq      squash and stretch, perspective for the 3d below
   #id-r       the 3d turn, preserve-3d
     slabs     the extrusion, face colour walked toward `side`
     #id-face  the plate, with #id-e0 and #id-e1
   size is the svg box; the plate is 60 of its 64 units. */
export function mascot(id, size, { face, eye, side, layers = 12, depth = 2.4, stroke = '', extra = '' } = {}) {
  const u = size / GRID, P = HEAD.plate, E = HEAD.eye;
  const px = P.x * u, ps = P.s * u;
  const eyes = EYE_CX.map((cx, i) =>
    `<div class="m-eye" id="${id}-e${i}" style="left:${((cx - E.w / 2) * u - px).toFixed(2)}px;top:${((E.cy - E.h / 2) * u - px).toFixed(2)}px;width:${(E.w * u).toFixed(2)}px;height:${(E.h * u).toFixed(2)}px;border-radius:${(E.h * u / 2).toFixed(2)}px;background:${eye}"></div>`).join('');
  const slabs = Array.from({ length: layers }, (_, i) =>
    `<div class="m-slab" style="transform:translateZ(${(-(i + 1) * depth).toFixed(1)}px);background:${side}"></div>`).reverse().join('');
  return `<div class="m" id="${id}" style="width:${size}px;height:${size}px"><div class="m-sq" id="${id}-sq"><div class="m-r" id="${id}-r" style="left:${px}px;top:${px}px;width:${ps}px;height:${ps}px">${slabs}<div class="m-face" id="${id}-face" style="background:${face};${stroke}">${eyes}${extra}</div></div></div></div>`;
}
export const mascotGeo = size => {
  const u = size / GRID;
  return { u, plate: HEAD.plate.s * u, eyeW: HEAD.eye.w * u, eyeH: HEAD.eye.h * u, eyeDX: HEAD.eye.sep / 2 * u, eyeDY: (HEAD.eye.cy - 32) * u };
};

