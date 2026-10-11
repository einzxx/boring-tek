/* the boring tek — lib/gl-layer.mjs. a webgl layer drawn in its own browser.

   the rig's browser runs on paused virtual time, and under swiftshader, chrome's
   cpu webgl, its screenshots hang (chrome 154). so a clip that wants webgl
   draws it here instead: a second headless chrome forced onto swiftshader, no
   virtual time, nothing but a canvas. no gpu driver touches a pixel, so the
   same state draws the same png every run. the clip hands each frame's png to
   the rig through gag.prepare, and shows it as an image.

     import { glLayer } from './lib/gl-layer.mjs';
     const GL = await glLayer({ w: 540, h: 960, dsf: 2, script, data, build });
       script   classic js that runs first, three.js from lib/three-inline.mjs
       data     json, window.__GLD in the page
       build    a function run in the page once. it reads window.__GLD, makes its
                renderer on canvas#gl with preserveDrawingBuffer, and defines
                window.__gl.render(state), which draws and returns nothing
     GL.renderer                 the webgl renderer string, checked to be swiftshader
     await GL.render(state)      the frame, a png data url
     await GL.close()
*/

import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(p => { try { return fs.existsSync(p); } catch { return false; } });

export async function glLayer({ w, h, dsf, script, data, build }) {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: true,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--force-color-profile=srgb', '--disable-dev-shm-usage', '--mute-audio', '--hide-scrollbars'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: dsf });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e && e.message || e)));
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:transparent">
<canvas id="gl" width="${w * dsf}" height="${h * dsf}" style="display:block;width:${w}px;height:${h}px"></canvas>
<script>${script}</script>
<script>window.__GLD = ${JSON.stringify(data)};(${build.toString()})();</script></body></html>`);
  if (errors.length) throw new Error('the gl page threw: ' + errors.join(' | '));
  const renderer = await page.evaluate(() => {
    const c = document.getElementById('gl'), gl = c.getContext('webgl2') || c.getContext('webgl');
    const e = gl && gl.getExtension('WEBGL_debug_renderer_info');
    return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : '?';
  });
  if (!/swiftshader/i.test(renderer)) { await browser.close(); throw new Error('the gl layer is not on swiftshader: ' + renderer); }
  return {
    renderer,
    render: state => page.evaluate(s => { window.__gl.render(s); return document.getElementById('gl').toDataURL('image/png'); }, state),
    close: () => browser.close(),
  };
}
