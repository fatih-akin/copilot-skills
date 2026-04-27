---
name: copilot-skills
description: Create interactive data visualizations from CSV files. Includes chart planning, spec generation, and preview rendering for bar, line, heatmap, timeline, histogram, and pie charts.
---

# Copilot Skills - Data Charting

This skill package provides a complete workflow for creating interactive Vega-based data visualizations from CSV datasets.

## Overview

Three coordinated skills work together:

1. **chart-planner** - Analyze data and suggest chart options
2. **chart-builder** - Generate Vega specs and render chart previews
3. **data-charting** - Orchestrator that combines both skills

## How to Use

### Basic Workflow

When user wants to visualize CSV data:

1. Load the CSV file
2. Infer column types and schema
3. Suggest appropriate chart options (planner)
4. User selects a chart option
5. Build the chart and render preview (builder)

### Step-by-Step

```
CSV File → Load → Infer Schema → Suggest Options → User Choice → Build → Render → HTML Preview
```

## Supported Chart Types

- **Bar Chart** - Compare values across categories
- **Line Chart** - Show trends over time or continuous data
- **Heatmap** - Display 2D patterns and correlations
- **Timeline/Gantt** - Visualize events, projects, or schedule data
- **Histogram** - Analyze distribution of numerical data
- **Pie Chart** - Show composition and percentages

## Handling Large Datasets

For datasets with many rows:

1. Automatic row limiting to maintain performance
2. Intelligent aggregation suggestions
3. Fallback visualization strategies
4. Clear indication when large dataset mode is active

## Key Features

- **Automatic Schema Detection** - Detects numeric, temporal, categorical, and string types
- **Smart Recommendations** - Suggests best chart types based on data characteristics
- **Transformation Support** - Applies field transformations when needed
- **Multiple Output Formats** - HTML preview, PNG, Vega-Lite spec JSON
- **Performance Optimized** - Handles large datasets efficiently

## File Structure

```
├── src/
│   ├── tools/
│   │   ├── loadTabularFile.ts        # CSV file loading
│   │   ├── inferSchema.ts            # Auto-detect column types
│   │   ├── suggestChartOptions.ts    # Chart recommendations
│   │   ├── generateVegaSpec.ts       # Vega spec generation
│   │   ├── renderChartPreview.ts     # HTML rendering
│   │   └── spec-builders/            # Chart-specific specs
│   └── index.ts
├── examples/                          # Sample CSV files
├── artifacts/                         # Generated chart previews
└── .skills/
    ├── chart-planner/SKILL.md
    ├── chart-builder/SKILL.md
    └── data-charting/SKILL.md
```

## Sub-Skills

For detailed instructions on each skill, see:

- [**chart-planner**](./.skills/chart-planner/SKILL.md) - Data analysis and chart option planning
- [**chart-builder**](./.skills/chart-builder/SKILL.md) - Vega spec generation and preview rendering
- [**data-charting**](./.skills/data-charting/SKILL.md) - Complete workflow orchestration

## Example Usage

```
User: "Can you show me a chart of monthly sales trends from this CSV?"

1. System loads the CSV
2. Analyzes columns and infers types
3. Suggests: Line chart (for trend), Bar chart (alternative)
4. User: "Use line chart"
5. System generates Vega spec and renders to HTML
6. Returns preview artifact
```

## Best Practices

- **Always specify rowLimit** for potentially large datasets
- **Use data-charting skill** as entry point for most use cases
- **Apply transformations** suggested by planner before building
- **Check for large dataset mode** in tool outputs
- **Return artifact paths** after successful rendering

## Examples

See `examples/` folder for sample CSV files:
- `sales.csv` - Sales data with dates and amounts
- `aircraft-maintenance-plan.csv` - Complex schedule data
- `customers-10000.csv` - Large dataset example
- `plans.csv` - Project/plan timeline data
