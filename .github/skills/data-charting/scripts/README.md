# Skill Scripts

This folder contains the prebuilt runtime for the `data-charting` skill.

## Contents

- `build/dist/*` — precompiled runtime (output of `npm run build`)

## Helper scripts

The runnable helper scripts (`build-chart-preview.mjs`, etc.) live in the root `scripts/` folder and import from `.github/skills/data-charting/scripts/build/dist/` after a build.

## Why this exists

The `build/dist/` snapshot lets others use this skill without needing to rebuild TypeScript from source.
