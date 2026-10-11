/* the boring tek — lib/three-inline.mjs. three.js as one classic script, for
   a page the rig serves as a single html file.

   three 0.186 ships esm only: build/three.module.js imports build/three.core.js.
   the rig's server answers every path with the scene page, so nothing can be
   fetched, and a module script would load after the page reports ready. this
   reads both files out of node_modules and rewrites the three import and
   export statements into plain scope, so `window.THREE` exists before the
   gag's page() runs. nothing is fetched, the same as gsap.

     import { threeScript, linesScript } from './lib/three-inline.mjs';
     markup: '<script>' + threeScript() + linesScript() + '</script>' + ...

   linesScript() is the fat line addon, examples/jsm/lines: LineSegments2,
   LineMaterial and LineSegmentsGeometry, the same rewrite, as
   `window.THREE_LINES`. webgl draws 1px lines only, these draw any width.
*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BUILD = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'node_modules', 'three', 'build');
/* `a as b, c` -> [['a', 'b'], ['c', 'c']] */
const names = list => list.split(',').map(s => s.trim()).filter(Boolean).map(s => { const [a, b] = s.split(/\s+as\s+/); return [a, b || a]; });
const one = (src, re, what) => {
  const m = src.match(re);
  if (!m || src.match(new RegExp(re.source, 'gm')).length !== 1) throw new Error('three-inline: expected one ' + what);
  return m;
};

let cached = null;
export function threeScript() {
  if (cached) return cached;
  let core = fs.readFileSync(path.join(BUILD, 'three.core.js'), 'utf8');
  let mod = fs.readFileSync(path.join(BUILD, 'three.module.js'), 'utf8');
  for (const s of [core, mod]) if (/import\.meta|import\(|<\/script/i.test(s)) throw new Error('three-inline: the build has a dynamic import, import.meta or a script close');
  const ce = one(core, /^export \{([^}]*)\};\s*$/m, 'export in three.core.js');
  core = core.replace(ce[0], 'return {' + names(ce[1]).map(([a, b]) => b + ':' + a).join(',') + '};');
  const mi = one(mod, /^import \{([^}]*)\} from '\.\/three\.core\.js';\s*$/m, 'import in three.module.js');
  const mr = one(mod, /^export \{([^}]*)\} from '\.\/three\.core\.js';\s*$/m, 're export in three.module.js');
  const me = one(mod, /^export \{([^}]*)\};\s*$/m, 'export in three.module.js');
  mod = mod.replace(mi[0], 'const {' + names(mi[1]).map(([a, b]) => a + ':' + b).join(',') + '} = CORE;')
    .replace(mr[0], '')
    .replace(me[0], 'return {' + [...names(mr[1]).map(([a, b]) => b + ':CORE.' + a), ...names(me[1]).map(([a, b]) => b + ':' + a)].join(',') + '};');
  if (/^\s*(import|export)\s/m.test(core + mod)) throw new Error('three-inline: an import or export is left');
  cached = '(function(){"use strict";const CORE=(function(){' + core + '\n})();window.THREE=Object.freeze((function(){' + mod + '\n})());})();';
  return cached;
}

/* the three addon files, in dependency order. `import {} from 'three'` reads
   window.THREE, the relative imports are the earlier files in the same scope */
const LINES = ['LineSegmentsGeometry.js', 'LineMaterial.js', 'LineSegments2.js'];
export function linesScript() {
  const dir = path.join(BUILD, '..', 'examples', 'jsm', 'lines');
  const body = LINES.map(f => {
    let s = fs.readFileSync(path.join(dir, f), 'utf8');
    if (/import\.meta|import\(|<\/script/i.test(s)) throw new Error('three-inline: ' + f + ' has a dynamic import, import.meta or a script close');
    const im = one(s, /^import \{([^}]*)\} from 'three';\s*$/m, "three import in " + f);
    s = s.replace(im[0], 'const {' + names(im[1]).map(([a, b]) => a + ':' + b).join(',') + '} = window.THREE;');
    s = s.replace(/^import \{[^}]*\} from '\.\/(LineSegmentsGeometry|LineMaterial)\.js';\s*$/gm, '');
    const ex = one(s, /^export \{([^}]*)\};\s*$/m, 'export in ' + f);
    s = s.replace(ex[0], '');
    if (/^\s*(import|export)\s/m.test(s)) throw new Error('three-inline: an import or export is left in ' + f);
    /* each file in its own scope, its one export handed out */
    return 'const ' + ex[1].trim() + '=(function(){' + s + '\nreturn ' + ex[1].trim() + ';})();';
  }).join('\n');
  return '(function(){"use strict";' + body + '\nwindow.THREE_LINES={LineSegments2,LineMaterial,LineSegmentsGeometry};})();';
}
