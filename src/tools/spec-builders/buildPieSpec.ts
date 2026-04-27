import type { ChartRecommendation, DataRow } from "../../types.js";

export const buildPieSpec = (
  rows: DataRow[],
  recommendation: ChartRecommendation,
  title: string,
  description: string
): Record<string, unknown> => ({
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  description,
  title,
  data: { values: rows },
  width: 500,
  height: 500,
  layer: [
    {
      mark: { type: "arc", innerRadius: 0, cornerRadius: 4 },
      encoding: {
        theta: { field: recommendation.yField, type: "quantitative" },
        color: { field: recommendation.xField, type: "nominal", legend: { labelFontSize: 12, titleFontSize: 13 } },
        tooltip: [
          { field: recommendation.xField, type: "nominal", title: "Category" },
          { field: recommendation.yField, type: "quantitative", title: "Count" }
        ]
      }
    },
    {
      mark: { type: "text", radiusOffset: 60, fontSize: 11 },
      encoding: {
        theta: { field: recommendation.yField, type: "quantitative" },
        text: { field: recommendation.yField, type: "quantitative" }
      }
    }
  ],
  config: {
    legend: {
      labelFontSize: 12,
      titleFontSize: 13,
      strokeColor: "gray",
      fillColor: "#EEEEEE"
    },
    title: {
      fontSize: 18,
      fontWeight: "bold",
      anchor: "start",
      color: "#152033"
    },
    font: "IBM Plex Sans, Segoe UI, sans-serif"
  }
});
