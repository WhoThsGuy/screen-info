# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Single-page static site (Ukrainian UI) that reads and displays the user's monitor/display
information in the browser: resolution, DPR (system scale), page zoom, viewport, color depth,
color gamut, refresh rate, orientation, touch support, and platform details.

No framework, no bundler. The page is plain HTML + CSS, and the logic is written in
**TypeScript** ([src/script.ts](src/script.ts)) compiled to plain JS at `dist/script.js`.

Files: [index.html](index.html), [style.css](style.css), [src/script.ts](src/script.ts).

## Commands

- `npm install` — install dev dependencies (TypeScript, Prettier, husky, lint-staged).
- `npm run build` — compile `src/script.ts` → `dist/script.js` via `tsc`.
- `npm run dev` — recompile on change (`tsc --watch`).
- `npm run format` — format the whole tree with Prettier.
- `npm run format:check` — verify formatting without writing (CI-style check).

`dist/` and `node_modules/` are git-ignored; run `npm run build` before opening the page.

## Formatting & git hooks

- Prettier config is in [.prettierrc](.prettierrc) (single quotes, no semicolons, width 80,
  `arrowParens: avoid`, LF endings);
  [.prettierignore](.prettierignore) excludes `dist/`, `node_modules/`, the lockfile, and this
  `CLAUDE.md` (so Prettier does not reflow its tables or mangle wildcard tokens in prose).
- A husky `pre-commit` hook ([.husky/pre-commit](.husky/pre-commit)) runs `lint-staged`, which
  formats staged files with Prettier before they are committed — unformatted code cannot land.
  The hook only activates after `npm install` (or `npm run prepare`) has run `husky` in a shell
  where `git` is on PATH.
- [.gitattributes](.gitattributes) normalizes line endings to LF in the repo to avoid the
  Windows "LF will be replaced by CRLF" warning.
- When editing Markdown, wrap wildcard tokens like `` `prefers-*` `` in backticks — a bare `*`
  is parsed as emphasis and Prettier will rewrite it.

## Running

After building, open [index.html](index.html) directly in a browser — there is no dev server.
The compiled `dist/script.js` is emitted as a **classic script** (the source has no `import`/
`export`), so it loads over `file://` and the page works fully offline. The only external
resource is the Inter font from Google Fonts (with a system-font fallback).

> If you ever add `import`/`export` to the source, `tsc` will emit an ES module and the
> `<script>` tag in [index.html](index.html) must become `type="module"` — which then requires
> serving over `http://` instead of opening the file directly.

## Architecture

All logic lives in [src/script.ts](src/script.ts) and is data-driven:

- `buildCards()` returns an **array of card descriptor objects** (`icon`, `label`, `value`,
  `hint`, optional `featured`, optional `id`). This is the single source of truth for what the
  page shows — **add or change a metric by editing this array**, not the DOM.
- `buildGrid()` creates the card DOM **once** and caches each card's element refs
  (`cardEls` / `valueEls` / `hintEls`) keyed by label. The grid is never rebuilt afterwards.
- `update()` calls `buildCards()` again and patches in place **only** the cards whose value or
  hint changed, then calls `flash()` on those cards (a one-shot `.flash` highlight). It skips the
  `id="refresh"` card. This in-place model is deliberate: rebuilding the grid made cards vanish
  and re-animate every time mobile browser chrome showed/hid on scroll (a `resize` storm).
- Live updates: `resize`, `orientationchange`, and `screen.orientation` change events call a
  debounced `refresh()` → `update()`.
- Refresh rate is tracked **live** via `trackRefreshRate()`, which samples `requestAnimationFrame`
  frame intervals and reports the **median** of a rolling window into the `id="refresh"` card. It
  updates as the estimate converges (the first ~1s after load is too janky for a one-shot average)
  and stops once the value holds steady, so the page can idle. It is not tied to resize.

Display facts come from `screen.*`, `window.devicePixelRatio`, `window.matchMedia(...)`
(color-gamut / dynamic-range / `prefers-*` queries), and `navigator.*`.

## Project rules

These are binding conventions for this repo (canonical source — do not rely on external memory):

- **Language:** all logic is TypeScript in [src/script.ts](src/script.ts); never hand-edit the
  generated `dist/script.js`. Run `npm run build` after changing the source.
- **UI text is in English** — user-facing strings (card labels, hints, headings) are written
  directly in source. There is no i18n layer (a previous Ukrainian/multi-locale catalog was
  removed in favor of an English-only page; a future Next.js rewrite is the planned path for
  proper per-locale routing and metadata).
- **Code comments, documentation, and commit messages are in English, with no emoji.**
  (Emoji are allowed only as UI card icons in [src/script.ts](src/script.ts), where they are
  product content, not documentation.)
- **Styling via CSS variables:** reuse the custom properties in `:root`
  (see [style.css](style.css)) for theme/accent colors instead of hardcoding.
- **Loading:** the script is loaded from `<head>` with `defer` (modern pattern), not at the end
  of `<body>`.
- **Git:** do not sign commits (no `-S` / GPG signing, no signed tags). Do not add authorship
  or tool-attribution trailers to commit messages or PRs — e.g. no `Co-Authored-By: Claude ...`
  and no "Generated with Claude Code" lines. Commit messages contain only the change description.
