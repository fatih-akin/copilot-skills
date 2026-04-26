# Data Charting Skill

This repository contains a GitHub Copilot skill definition and a TypeScript MCP server that can:

- load a CSV dataset
- infer a simple tabular schema
- suggest chart options with reasons and transformation plans
- generate a Vega-Lite spec for bar, line, scatter, or timeline (gantt-style) charts
- render an HTML preview artifact

## Skill split

The chart workflow is split into two skills:

- `.github/skills/chart-planner`: decide which charts are possible and why
- `.github/skills/chart-builder`: build the selected chart into HTML/PNG artifacts

The existing `.github/skills/data-charting` skill acts as an orchestrator for this two-step flow.

## Large dataset behavior

- `generate_vega_spec` supports `rowLimit` (default: `10000`).
- If input row count exceeds the limit, the tool applies automatic aggregation fallback:
	- date field available: aggregate counts by date (line chart)
	- otherwise category field available: aggregate counts by category (bar chart)
- In large dataset mode, the response includes `largeDataset` metadata with mandatory transformation suggestions.
- `render_chart_preview` supports `includePngBase64: false` to reduce response size while still writing PNG artifacts to disk.

## Current scope

The first implementation targets CSV input only. JSON and Excel support are intentionally deferred until the CSV flow is validated.

## Project layout

- `.github/skills/data-charting/SKILL.md`: skill instructions for Copilot
- `src/`: MCP server and charting tools
- `examples/`: sample CSV data for local testing
- `artifacts/`: generated chart previews

## Run locally

```bash
npm install
npm run build
npm run dev
```

The server uses stdio transport for MCP clients.