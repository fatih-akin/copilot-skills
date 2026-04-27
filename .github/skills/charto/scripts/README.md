# Skill Scripts

This folder contains the prebuilt runtime for the `data-charting` skill.

## Contents

- `build/dist/bundle.mjs` — **single-file bundle** (esbuild, all JS deps included)
- `build/dist/index_bg.wasm` — **WASM binary for PNG rendering** (bundled, cross-platform)
- `build/dist/*.js` — TypeScript compilation output (dev reference)

## Zero-Dependency Distribution

`bundle.mjs` + `index_bg.wasm` are **fully self-contained** — no `npm install` needed.

**All features work out of the box:**

✅ CSV loading  
✅ Schema inference  
✅ Chart recommendation  
✅ Vega-Lite spec generation  
✅ HTML artifact rendering  
✅ PNG artifact rendering (WASM-based, no native module compilation required)  

## Usage on another machine

1. Copy the entire `.github/skills/data-charting/` folder to your destination
2. Use `scripts/build/dist/bundle.mjs` as your MCP server entrypoint
3. No additional `npm install` — everything is bundled

## Rebuilding

From the repo root:

```bash
npm run build    # runs tsc + esbuild bundle + WASM copy
```

The build script:
- Compiles TypeScript to `.github/skills/data-charting/scripts/build/dist/`
- Bundles all dependencies into `bundle.mjs` using esbuild
- Copies WASM binary (`index_bg.wasm`) to dist folder
- Result is ready to distribute

## Why this exists

The `bundle.mjs` + `index_bg.wasm` snapshot lets others use this skill without installing npm dependencies or native modules. Completely portable, cross-platform, and maintenance-free.
