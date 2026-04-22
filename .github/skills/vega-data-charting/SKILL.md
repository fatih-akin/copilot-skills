---
name: vega-data-charting
description: Create charts from CSV data using Vega-Lite. Use this when the user asks to visualize a tabular dataset, inspect columns, or generate a chart preview from a CSV file.
---

Use this skill as an orchestrator over two sub-skills:

- `chart-option-planner`: decides what chart options are possible.
- `chart-builder`: builds artifacts for the selected option.

Recommended workflow:

1. Use `load_tabular_file` to read the dataset.
2. Use `infer_schema` to determine field types.
3. Use `suggest_chart_options` to produce chart decisions with reasons.
4. Ask the user to choose one option.
5. Build using the selected option:
   - transform rows if needed
   - use `generate_vega_spec`
   - use `render_chart_preview`
6. Briefly explain what chart was selected and why.

Large dataset flow (required):

1. Always pass `rowLimit` for potentially large files.
2. If `suggest_chart_options` or `generate_vega_spec` indicates large dataset mode:
   - explicitly mention that large dataset mode was triggered
   - include the suggested options and the recommended option
   - explain whether fallback aggregation was applied during build
3. For rendering in large dataset mode, call `render_chart_preview` with `includePngBase64: false` unless inline image is explicitly requested.

Rules:

- Do not invent columns or values.
- If the data is not suitable for bar, line, scatter, or timeline, say so clearly.
- Prefer small, readable charts over overloaded multi-series output.
- For large datasets, prefer aggregated charts (count/sum/grouped) over raw row-level plots.
- Return the generated artifact path when a preview is available.
- Ask for clarification if the file path is missing.