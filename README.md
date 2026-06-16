# screen-info

A single-page site that reads and displays your monitor/display information directly in the
browser: resolution, system scale (DPR), page zoom, viewport, available area, refresh rate,
color depth, color gamut, orientation, touch support, system theme, and platform details.

The UI is in English. All values update live when you resize or zoom the window.

## Tech stack

- Plain HTML and CSS (dark theme, glassmorphism cards, no framework).
- Logic written in TypeScript, compiled to a plain classic script with `tsc`.
- No bundler, no runtime dependencies.

## Project structure

```
index.html        Markup (loads the compiled script from <head> with defer)
style.css         Styling (CSS custom properties in :root)
src/script.ts     Application logic (TypeScript source)
dist/script.js    Compiled output (generated, git-ignored)
```

## Getting started

```bash
npm install      # install dev dependencies (TypeScript only)
npm run build    # compile src/script.ts -> dist/script.js
```

Then open `index.html` in a browser. There is no dev server: the compiled script is a classic
script, so the page loads over `file://` and works fully offline. The only external resource is
the Inter font from Google Fonts (a system-font fallback is used otherwise).

## Scripts

- `npm run build` - compile once.
- `npm run dev` - recompile on change (`tsc --watch`).

## How it works

The page is data-driven: `buildCards()` in [src/script.ts](src/script.ts) returns an array of
card descriptors that is the single source of truth for what the page shows. `render()` rebuilds
the grid from that array and flashes any card whose value changed. The refresh rate is measured
asynchronously by counting `requestAnimationFrame` callbacks over roughly one second.

## Deployment

Pushing to `main` triggers the [GitHub Pages workflow](.github/workflows/deploy.yml), which runs
`npm ci && npm run build`, assembles `index.html`, `style.css`, and `dist/` into a clean bundle,
and publishes it. Enable it once under **Settings -> Pages -> Build and deployment -> Source:
GitHub Actions**.

## License

[MIT](LICENSE) © [WhoThsGuy](https://github.com/WhoThsGuy)
