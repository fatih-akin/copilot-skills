# Skill Scripts

This folder contains the prebuilt runtime for the `data-charting` skill.

## Contents

- `build/dist/bundle.mjs` — **single-file bundle** (esbuild, all JS deps included — use this on other machines)
- `build/dist/*.js` — TypeScript compilation output (still requires `node_modules`, for local dev)

## Running on another machine

`bundle.mjs` contains all JavaScript dependencies inline — **no `npm install` needed** for the core flow.

HTML artifacts work out of the box with zero setup.

PNG export is optional. If you want PNG output, install one native package:

```bash
npm install @resvg/resvg-js    # downloads prebuilt binary, no build tools needed
```

If `@resvg/resvg-js` is not installed, `render_chart_preview` silently skips PNG and returns HTML only (`pngSkipped: true`).

## Rebuilding

From the repo root:

```bash
npm run build    # runs tsc + esbuild bundle in one step
```

## Why this exists

The `bundle.mjs` snapshot lets others use this skill without installing all npm dependencies from scratch.
