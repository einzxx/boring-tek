/* the boring tek — post67. the AI agent hacker, the first clip on the full
   screen template, lib/fullscreen.mjs.

   the facts are Forbes', Thomas Brewster, 2026-09-22: one hacker, AI agents,
   as many as 100 organisations targeted over five days, Sept 10 to 15, about
   8,000 dollars all in, at least 618,000 card records, found because the
   attack servers were left open online. the footage is four Pexels stock
   clips, no identifiable face in any of them, the Pexels license forbids
   showing one in a bad light. sources and licenses in demo/assets/LICENSES.md.

     frame 0   the masked hacker typing, ONE HACKER mid slam
     l1        one hacker ...       punch on AI agents, cut to the switch
                                    lights on hundred, 100, punch on five, 5 DAYS
     l2        the cost ...         cut to the red code on cost, $8,000, the
                                    payoff on six: cut back to the hooded
                                    figure, later, 618,000 over the dark wall,
                                    the green flash, a punch on credit
     l3        he got caught ...    cut to the red figure on caught, he pops in
                                    and squints, punch on leaving, cut to the
                                    switch on servers, he smiles on yours
     THE BORING TEK, one glitch in, a 1.5s card, the end

     node post67.mjs --takes     read the lines, print the words, stop
     node post67.mjs --stills    one still per beat
     DEMO_FPS=12 node post67.mjs the preview
     node post67.mjs             60fps
*/

import { fullscreen } from './lib/fullscreen.mjs';

await fullscreen({
  post: 67,
  footage: {
    hood: 'assets/pexels-hooded-code.mp4',
    rack: 'assets/pexels-switch-lights.mp4',
    code: 'assets/pexels-code-red.mp4',
    back: 'assets/pexels-hacker-red.mp4',
  },
  lines: [
    '[excited] one hacker. a team of AI agents. a hundred companies targeted in five days.',
    '[amused] the cost? about eight thousand dollars. for six hundred thousand credit cards.',
    '[cheeky] he got caught leaving his own servers open. check yours.',
  ],
  shots: [
    { at: 0, clip: 'hood', src: 3.0 },
    { at: 'hundred', clip: 'rack', src: 2.0 },
    { at: 'cost', clip: 'code', src: 1.0 },
    /* 618,000 over the dark wall left of him, a calm stretch so it reads at a glance */
    { at: 'six', clip: 'hood', src: 12.0, focus: [0.22, 0.5] },
    { at: 'caught', clip: 'back', src: 1.0 },
    { at: 'servers', clip: 'rack', src: 12.0 },
  ],
  punches: [{ at: 'agents' }, { at: 'five' }, { at: 'credit' }, { at: 'leaving' }, { at: 'yours', by: 0.1 }],
  big: [
    { at: 0, text: 'ONE HACKER' },
    { at: 'hundred', text: '100' },
    { at: 'five', text: '5 DAYS' },
    { at: 'eight', text: '$8,000' },
    { at: 'six', text: '618,000' },
  ],
  payoff: 'six',
  /* the pauses inside a line to 0.18s, to land near 13.5s */
  tighten: 0.18,
  mascot: { corner: 'tr', react: [{ at: 'caught', mood: 'squint', for: 2.0 }, { at: 'yours', mood: 'happy' }] },
});
