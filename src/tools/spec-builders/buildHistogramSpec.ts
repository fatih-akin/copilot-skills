import type { ChartRecommendation, DataRow } from "../../types.js";

export const buildHistogramSpec = (
  rows: DataRow[],
  recommendation: ChartRecommendation,
  title: string,
  description: string
): Record<string, unknown> => ({
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  description,
  title,
  data: { values: rows },
  width: 720,
  height: 420,
  mark: "bar",
  encoding: {
    x: { field: recommendation.xField, type: "quantitative", bin: true, title: recommendation.xField },
    y: { aggregate: "count", type: "quantitative", title: "Count" },
    tooltip: [
      { field: recommendation.xField, type: "quantitative", bin: true },
      { aggregate: "count", type: "quantitative", title: "Count" }
    ]
  }
});
