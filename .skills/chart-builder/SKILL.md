---
name: chart-builder
description: Build chart artifacts from a selected chart option by generating Vega spec and rendering preview outputs.
---

When the user selects a chart option to build:

1. Confirm input dataset path or pre-transformed rows.
2. If needed, apply the selected transformation plan from planner output.
3. Use `infer_schema` on transformed rows.
4. Use `generate_vega_spec` to generate a Vega-Lite spec.
5. Use `render_chart_preview` to generate artifacts.
6. Return artifact paths and a short explanation of what was built.

Large dataset rules:

1. Always pass `rowLimit` for potentially large datasets.
2. If large dataset metadata is returned from `generate_vega_spec`, mention:
   - fallback strategy
   - suggestion list
3. Use `includePngBase64: false` unless inline base64 image is explicitly requested.

Rules:

- Keep charts readable (aggregate/filter when needed).
- Do not invent fields.
- Return generated artifact paths when available.
