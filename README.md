# Vega Data Charting Skill

This repository contains a GitHub Copilot skill definition and a TypeScript MCP server that can:

- load a CSV dataset
- infer a simple tabular schema
- generate a Vega-Lite spec for bar, line, scatter, or timeline (gantt-style) charts
- render an HTML preview artifact

## Current scope

The first implementation targets CSV input only. JSON and Excel support are intentionally deferred until the CSV flow is validated.

## Project layout

- `.github/skills/vega-data-charting/SKILL.md`: skill instructions for Copilot
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