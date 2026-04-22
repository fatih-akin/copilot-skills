---
name: chart-option-planner
description: Analyze CSV data and propose chart options with reasons and transformation plans. Use this first in a two-step chart workflow.
---

When the user asks what charts can be created from a CSV dataset:

1. Use `load_tabular_file` to load the CSV rows.
2. Use `infer_schema` to determine field types.
3. Use `suggest_chart_options` to generate ranked chart options.
4. Explain each option briefly with:
   - chart type
   - reason
   - whether transformation is required
   - transformation summary (if required)
5. If `largeDatasetMode` is true:
   - mention it explicitly
   - highlight the recommended option from `recommendedOptionId`
   - recommend aggregated options over raw row-level plotting

Rules:

- Do not render charts in this skill.
- Do not invent columns, metrics, or transformations outside tool output.
- If no viable options are returned, say so clearly and ask for dataset changes.
- Keep recommendations concise and decision-oriented.
