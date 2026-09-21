# the boring tek

theboringtek.com. one file, no build step, no dependencies. see `CLAUDE.md`.

## the tools hub

[theboringtek.com/tools](https://theboringtek.com/tools/): one card per free
tool, in english, russian and latvian. the source is `tools/index.html`; the
russian and latvian pages are written by `node tools/build-langs.mjs`.

## the cleaner

a free tool at [theboringtek.com/tools/clean](https://theboringtek.com/tools/clean/). paste
text or drop a file and it removes the hidden marks: zero width characters,
direction marks, soft hyphens, odd spaces, curly quotes and long dashes in text,
and exif, xmp, icc, c2pa and document properties in png, jpg, webp, pdf and
docx. it counts what it found, checks its own output and hands the clean text or
file back. everything runs in the browser: nothing is uploaded, there is no
account, and the two libraries it borrows (pdf-lib, jszip) are fetched only when
a pdf or a docx arrives.

three addresses, one source: `/tools/clean/`, `/ru/tools/clean/` and
`/lv/tools/clean/`, the last two written by `node tools/build-langs.mjs` out of
`tools/clean/index.html`. the old `/clean/` addresses are stubs that forward.

## the link checker

a free tool at [theboringtek.com/tools/check](https://theboringtek.com/tools/check/). paste
a link and it types out, one line at a time, what to look at before you open
it: the real address, https or not, a shortener or not, lookalike letters from
another alphabet, a copy of a known brand, a bare ip address, and a strange
shape (very long, many dots, many dashes, an unusual ending). green is nothing
found, yellow is look at this, red is danger, and a summary pill says which.
known bad lists are not checked yet. everything runs in the browser: nothing
is sent anywhere, and it cannot promise a link is safe, it only shows what to
look at.

three addresses, one source: `/tools/check/`, `/ru/tools/check/` and
`/lv/tools/check/`, the last two written by `node tools/build-langs.mjs` out of
`tools/check/index.html`.
