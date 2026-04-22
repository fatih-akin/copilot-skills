---
name: vega-data-charting
description: Create charts from CSV data using Vega-Lite. Use this when the user asks to visualize a tabular dataset, inspect columns, or generate a chart preview from a CSV file.
---

When the user asks for a chart from a CSV file:

1. Use `load_tabular_file` to read the dataset.
2. Use `infer_schema` to determine field types.
3. If the user did not specify a chart type, choose one based on the schema:
   - date + number => line chart
   - category + number => bar chart
   - number + number => scatter plot
   - date start + date end + category => timeline (gantt-style) chart
4. Use `generate_vega_spec` to create a valid Vega-Lite spec.
   - For large datasets, pass `rowLimit` (or rely on default) so the tool can apply automatic aggregation fallback.
   - If large dataset mode is triggered, include the returned suggestion list and explain the applied fallback strategy.
5. Use `render_chart_preview` to write an HTML preview artifact.
   - Use `includePngBase64: false` for large outputs to reduce payload size.
6. Briefly explain what chart was selected and why.

Large dataset flow (required):

1. Always pass `rowLimit` for potentially large files.
2. If `generate_vega_spec` returns `largeDataset` metadata:
   - explicitly mention that large dataset mode was triggered
   - include the suggestion list in the response
   - explain whether fallback aggregation was applied
3. For rendering in large dataset mode, call `render_chart_preview` with `includePngBase64: false` unless inline image is explicitly requested.

Rules:

- Do not invent columns or values.
- If the data is not suitable for bar, line, scatter, or timeline, say so clearly.
- Prefer small, readable charts over overloaded multi-series output.
- For large datasets, prefer aggregated charts (count/sum/grouped) over raw row-level plots.
- Return the generated artifact path when a preview is available.
- Ask for clarification if the file path is missing.