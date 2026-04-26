import type { ChartRecommendation, DataRow, InferredSchema } from "../../types.js";
import { toEncodingType } from "../chart-recommendation.js";
import { xAxisConfig, chartWidth } from "./axisUtils.js";

/** Handles bar, line, area, scatter, and boxplot — all use x/y encodings directly. */
export const buildGenericSpec = (
  rows: DataRow[],
  schema: InferredSchema,
  recommendation: ChartRecommendation,
  title: string,
  description: string
): Record<string, unknown> => {
  const xFieldSchema = schema.fields.find((f) => f.name === recommendation.xField)!;
  const yFieldSchema = schema.fields.find((f) => f.name === recommendation.yField)!;
  const mark = recommendation.chartType === "scatter" ? "point" : recommendation.chartType;

  return {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    description,
    title,
    data: { values: rows },
    width: chartWidth(rows, recommendation.xField, xFieldSchema.type),
    height: 420,
    mark,
    encoding: {
      x: { field: recommendation.xField, type: toEncodingType(xFieldSchema.type), title: recommendation.xField, ...xAxisConfig(rows, recommendation.xField, xFieldSchema.type) },
      y: { field: recommendation.yField, type: toEncodingType(yFieldSchema.type), title: recommendation.yField },
      tooltip: [
        { field: recommendation.xField, type: toEncodingType(xFieldSchema.type) },
        { field: recommendation.yField, type: toEncodingType(yFieldSchema.type) }
      ]
    }
  };
};
