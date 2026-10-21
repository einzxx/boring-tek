/* the boring tek — post68. made with AI, an outcome showcase on the full
   screen template, lib/fullscreen.mjs. the result first, then how.

   the game is real: demo/games/head-flap/index.html, built by Claude Code
   from the prompt below in 56.9s, timer to a smoke tested file, so the clip
   says about a minute. the footage is real too, three captures of our own,
   written by --capture to demo/assets/, ignored, regenerable from here:

     post68-game.mp4     the game in headless chrome at 60fps, 1080x1920, an
                         autopilot flapping for the next gap, seven gaps, then
                         it stops flapping and he crashes for the game over
     post68-prompt.mp4   the exact prompt, typed out on a black terminal
     post68-code.mp4     the real file scrolling fast, top to bottom

   green and white only, no second colour, a named exception to CLAUDE.md
   rule 9, Einz's call 2026-10-22: the game is green on black.

     frame 0   the game mid run, MADE WITH AI mid slam, a shake
     l1        i made this game ...   punches on with and about, cut on minute
                                      to the game later, 57 SECONDS, a punch
                                      on how
     l2        step one ...           cut to the prompt typing, STEP 1, the keys,
                                      punches on Claude and type
     l3        step two ...           cut to the code scrolling, STEP 2, a punch
                                      on all, the payoff on itself: the green
                                      flash, a shake
     l4        step three ...         cut to the game, STEP 3, a punch on open,
                                      the crash on play: a speed ramp to 0.35, a
                                      shake, the thud and the game over sound
     the game over held 0.9s, a punch in on it
     THE BORING TEK, one glitch in, a 1.5s card, the end

     node post68.mjs --capture   the three captures, nothing else
     node post68.mjs --takes     read the lines, print the words, stop
     node post68.mjs --stills    one still per beat
     DEMO_FPS=12 node post68.mjs the preview
     node post68.mjs             60fps
*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import puppeteer from 'puppeteer-core';
import ffmpeg from 'ffmpeg-static';
import { fullscreen } from './lib/fullscreen.mjs';

const DEMO = path.dirname(fileURLToPath(import.meta.url));
const GAME = path.join(DEMO, 'games', 'head-flap', 'index.html');
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe']
  .find(f => fs.existsSync(f));

/* the prompt the game was built from, word for word */
const PROMPT = 'build a small fun browser game in demo/games/head-flap/index.html, one file, no outside libraries: '
  + 'our white mascot head with his deep glow flies through gaps between glowing green bars on a black background, '
  + 'tap or space to fly, a score counter, a game over screen.';

const FPS = 60;
/* where the text sits in the two text captures, css px of the 540x960 frame.
   sized so it stays in the TikTok safe zone through the shot's push and
   punches, up to about 1.19 on both, and handed to the
   template as each shot's `keep`, which checks it on every frame */
const PROMPT_BOX = [106, 170, 406, 580], CODE_BOX = [112, 196, 404, 566];
const keep = b => [b[0] / 540, b[1] / 960, b[2] / 540, b[3] / 960];
/* the game run: seed 7, seven gaps, then hands off for the crash, 2.5s of game over */
const SEED = 7, GAPS = 7, AFTER = 2.5;

async function record(name, frames, draw) {
  const dir = path.join(DEMO, 'out', name + '-frames');
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  for (let f = 0; f < frames; f++) fs.writeFileSync(path.join(dir, 'f' + String(f).padStart(5, '0') + '.jpg'), await draw(f));
  const out = path.join(DEMO, 'assets', name + '.mp4');
  execFileSync(ffmpeg, ['-y', '-v', 'error', '-framerate', String(FPS), '-i', path.join(dir, 'f%05d.jpg'),
    '-c:v', 'libx264', '-crf', '14', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out]);
  fs.rmSync(dir, { recursive: true, force: true });
  console.log('  ' + path.relative(DEMO, out) + ', ' + frames + ' frames, ' + (frames / FPS).toFixed(2) + 's');
}

async function capture() {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 540, height: 960, deviceScaleFactor: 2 });
  const errs = []; page.on('pageerror', e => errs.push(e.message));

  /* 1. the game, played by an autopilot that flaps whenever he sinks under a
     point a little below the middle of the next gap */
  await page.goto(pathToFileURL(GAME).href + '?manual');
  await page.evaluate(() => {
    window.pilot = (g, GAPS) => {
      const s = g.state, P = g.P, nb = s.bars.find(b => b.x + P.barW > P.headX - P.headR);
      return s.mode === 'play' && s.score < GAPS && s.y > nb.top + P.gap * 0.62 && s.vy > -100;
    };
  });
  /* a dry run first, to know where the crash falls */
  const plan = await page.evaluate((SEED, GAPS) => {
    const g = window.headflap; g.reset(SEED); g.flap();
    let f = 0, died = null;
    while (died === null && f < 60 * 30) { if (window.pilot(g, GAPS)) g.flap(); g.tick(); f++; if (g.state.mode === 'over') died = f; }
    return { died, score: g.state.score };
  }, SEED, GAPS);
  if (plan.died === null) throw new Error('he never crashed');
  console.log('  the run: ' + plan.score + ' gaps, the crash at ' + (plan.died / FPS).toFixed(2) + 's');
  await page.evaluate(SEED => { const g = window.headflap; g.reset(SEED); g.flap(); }, SEED);
  const GAMEF = plan.died + Math.round(AFTER * FPS);
  await record('post68-game', GAMEF, async () => {
    await page.evaluate(GAPS => { const g = window.headflap; if (window.pilot(g, GAPS)) g.flap(); g.tick(); }, GAPS);
    return page.screenshot({ type: 'jpeg', quality: 95 });
  });

  /* 2. the prompt, typed out on a black terminal, 110 characters a second
     after a short lead of the bare cursor, then held with it blinking. the
     block is wrapped to PROMPT_BOX's width and centred in its height on the
     whole prompt, so it types down from a fixed top */
  const [pl, pt, pr, pb] = PROMPT_BOX;
  await page.setContent(`<!doctype html><meta charset="utf-8"><style>
    html,body{margin:0;background:#050506;width:540px;height:960px;overflow:hidden}
    #w{position:absolute;left:${pl}px;width:${pr - pl}px}
    #t{font:500 20px/1.45 ui-monospace,Menlo,Consolas,monospace;color:#f4f7f5;white-space:pre-wrap;word-break:break-word}
    #d{font:500 18px/1 ui-monospace,Menlo,Consolas,monospace;color:#3dff6e;margin-bottom:12px}
    i{display:inline-block;width:.6em;height:1.1em;vertical-align:-.2em;background:#3dff6e}
  </style><div id="w"><div id="d">~/boring-tek</div><div id="t"></div></div>`);
  const box = await page.evaluate((txt, pt, pb) => {
    const w = document.getElementById('w'), t = document.getElementById('t');
    t.textContent = '> ' + txt; t.appendChild(document.createElement('i'));
    w.style.top = ((pt + pb) / 2 - w.offsetHeight / 2) + 'px';
    const r = w.getBoundingClientRect();
    return [r.left, r.top, r.right, r.bottom];
  }, PROMPT, pt, pb);
  if (box[0] < pl - 0.5 || box[1] < pt - 0.5 || box[2] > pr + 0.5 || box[3] > pb + 0.5) throw new Error('the prompt does not fit PROMPT_BOX: ' + box.map(v => v.toFixed(1)).join(' / '));
  console.log('  the prompt block ' + box.map(v => v.toFixed(0)).join(' / ') + ' css');
  const RATE = 110, LEAD = Math.round(0.25 * FPS), TYPE = Math.ceil(PROMPT.length / RATE * FPS), HOLD = Math.round(1.5 * FPS);
  await record('post68-prompt', LEAD + TYPE + HOLD, async f0 => {
    const f = f0 - LEAD;
    const n = f < 0 ? 0 : Math.min(PROMPT.length, Math.ceil((f + 1) * RATE / FPS));
    const on = f < TYPE || Math.floor((f - TYPE) / 30) % 2 === 0;
    await page.evaluate((txt, on) => {
      const t = document.getElementById('t'); t.textContent = '> ' + txt;
      if (on) t.appendChild(document.createElement('i'));
    }, PROMPT.slice(0, n), on);
    return page.screenshot({ type: 'jpeg', quality: 95 });
  });

  /* 3. the real file, scrolling from the top to the bottom over 3.4s, easing in
     so it ends fast, in a window the size of CODE_BOX that fades out at its
     top and bottom edges. the captions sit under it, on black */
  const src = fs.readFileSync(GAME, 'utf8').replace(/\r/g, '').split('\n');
  const [cl, ct, cr, cb] = CODE_BOX, VIEW = cb - ct;
  await page.setContent(`<!doctype html><meta charset="utf-8"><style>
    html,body{margin:0;background:#050506;width:540px;height:960px;overflow:hidden}
    #v{position:absolute;left:${cl}px;top:${ct}px;width:${cr - cl}px;height:${VIEW}px;overflow:hidden;
      -webkit-mask-image:linear-gradient(transparent,#000 22px,#000 calc(100% - 22px),transparent)}
    #c{position:absolute;left:0;top:0;width:100%;font:400 12px/1.5 ui-monospace,Menlo,Consolas,monospace;color:#aab1ad;will-change:transform}
    .l{display:flex}.n{flex:0 0 28px;text-align:right;padding-right:8px;color:#3a3f3c}
    .x{flex:1;min-width:0;white-space:pre-wrap;word-break:break-all}.k{color:#3dff6e}.s{color:#8c9c92}.m{color:#545e58}
  </style><div id="v"><div id="c"></div></div>`);
  await page.evaluate(lines => {
    const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const paint = s => /^\s*\/\//.test(s) ? '<span class="m">' + esc(s) + '</span>'
      : esc(s).replace(/('[^']*'|`[^`]*`)/g, '<span class="s">$1</span>')
        .replace(/\b(const|let|function|return|if|else|for|of|new|while|window)\b/g, '<span class="k">$1</span>');
    document.getElementById('c').innerHTML = lines.map((s, i) => `<div class="l"><span class="n">${i + 1}</span><span class="x">${paint(s)}</span></div>`).join('');
  }, src);
  const tall = await page.evaluate(() => document.getElementById('c').scrollHeight);
  const SCROLL = Math.round(3.4 * FPS), TRAVEL = tall - VIEW + 24;
  await record('post68-code', SCROLL, async f => {
    const q = f / (SCROLL - 1), y = 24 - TRAVEL * (q * q * (3 - 2 * q) * 0.35 + q * q * 0.65);
    await page.evaluate(y => { document.getElementById('c').style.transform = `translateY(${y}px)`; }, y);
    return page.screenshot({ type: 'jpeg', quality: 95 });
  });

  await browser.close();
  if (errs.length) throw new Error('the page threw: ' + errs.join('; '));
}

if (process.argv.includes('--capture')) { await capture(); process.exit(0); }

await fullscreen({
  post: 68,
  footage: { game: 'assets/post68-game.mp4', prompt: 'assets/post68-prompt.mp4', code: 'assets/post68-code.mp4' },
  lines: [
    '[excited] i made this game with AI in about a minute. here is how.',
    '[cheerful] step one. open Claude Code and type what you want.',
    '[playful] step two. it writes all the code by itself.',
    '[excited] step three. open the file and play.',
  ],
  /* the pauses inside a line to 0.18s, as post67 */
  tighten: 0.18,
  shots: [
    { at: 0, clip: 'game', src: 4.0 },
    { at: 'minute', clip: 'game', src: 7.5 },
    { at: 'step', clip: 'prompt', src: 0, focus: [0.5, 0.5], keep: keep(PROMPT_BOX) },
    { at: 'step#2', clip: 'code', src: 0, focus: [0.5, 0.5], keep: keep(CODE_BOX) },
    /* the crash is at 12.62s in the capture: from 10.615s it lands on play,
       the speed easing down to 0.35 into the hit and back up 0.28s later */
    { at: 'step#3', clip: 'game', src: 10.615, ramp: [{ at: 'play', to: 0.35, over: 0.1 }, { at: 11.78, to: 1, over: 0.2 }] },
  ],
  punches: [{ at: 'with' }, { at: 'about' }, { at: 'how' }, { at: 'claude', by: 0.07 }, { at: 'type', by: 0.07 }, { at: 'all', by: 0.08 }, { at: 'open#2' }, { at: 12.2, by: 0.08 }],
  big: [
    { at: 0, text: 'MADE WITH AI' },
    { at: 'minute', text: '57 SECONDS', green: true },
    /* out before the typing reaches its line */
    { at: 'step', text: 'STEP 1', hold: 0.5 },
    { at: 'step#2', text: 'STEP 2', hold: 0.75 },
    { at: 'step#3', text: 'STEP 3', hold: 0.75 },
  ],
  payoff: 'itself',
  shake: [{ at: 0 }, { at: 'minute' }, { at: 'itself', amp: 5 }, { at: 'play', amp: 7 }],
  /* the game over has to read before the glitch */
  hold: 0.9,
  kit: {
    gameover: ['mixkit-213-arcade-retro-game-over.mp3', -12, 0.05],
    typing: ['mixkit-1387-fast-keyboard-typing.mp3', -22, 0, 2.4],
  },
  sounds: [
    { at: 'step', kind: 'typing', from: 'the prompt being typed' },
    { at: 'play', kind: 'thud', from: 'he hits the bar' },
    { at: 'play', kind: 'gameover', from: 'the game over' },
  ],
  /* no floating mascot, Einz's call 2026-10-22: the game head is him in this clip */
  mascot: null,
});
