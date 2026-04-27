# Data Charting Skill Reference

This reference explains how the single `data-charting` skill should behave.

## Workflow

1. Load data with `load_tabular_file`.
2. Infer schema with `infer_schema`.
3. Generate ranked options via `suggest_chart_options`.
4. Build selected option with `generate_vega_spec`.
5. Render outputs with `render_chart_preview`.

## Decision Rules

- Use aggregated chart options first for large datasets.
- Keep chart choice aligned with available field types.
- Do not invent columns or values.

## Large Dataset Mode

- Always pass `rowLimit` for potentially large files.
- Surface recommended option and fallback details.
- Use `includePngBase64: false` by default.

## Shareable Runtime

- Prebuilt runtime is provided in `../scripts/built/dist`.
- Share this skill folder so others can run without rebuilding TypeScript first.
