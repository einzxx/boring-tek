# the boring tek

theboringtek.com. one file, no build step, no dependencies. see `CLAUDE.md`.

## the cleaner

a free tool at [theboringtek.com/clean](https://theboringtek.com/clean/). paste
text or drop a file and it removes the hidden marks: zero width characters,
direction marks, soft hyphens, odd spaces, curly quotes and long dashes in text,
and exif, xmp, icc, c2pa and document properties in png, jpg, webp, pdf and
docx. it counts what it found, checks its own output and hands the clean text or
file back. everything runs in the browser: nothing is uploaded, there is no
account, and the two libraries it borrows (pdf-lib, jszip) are fetched only when
a pdf or a docx arrives.

three addresses, one source: `/clean/`, `/ru/clean/` and `/lv/clean/`, the
last two written by `node tools/build-langs.mjs` out of `clean/index.html`.
