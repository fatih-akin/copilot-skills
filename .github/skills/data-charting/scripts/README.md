# Skill Scripts

This folder contains the prebuilt runtime for the `data-charting` skill.

## Contents

- `built/dist/*` — precompiled runtime (output of `npm run build`)

## Helper scripts

The runnable helper scripts (`build-chart-preview.mjs`, `build-plans-daily-count.mjs`, `build-plans-gantt-slot.mjs`) live in the root `scripts/` folder and import directly from the root `dist/` after a build.

## Why this exists

The `built/dist/` snapshot lets others use this skill without needing to rebuild TypeScript from source.
