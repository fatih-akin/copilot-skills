import type { ChartRecommendation, DataRow, InferredSchema, SupportedChartType } from "../types.js";
import { getUnsupportedDatasetSuggestions, largeDatasetRequiresTransformationError } from "./chart-errors.js";
import { chooseLargeDatasetFallback } from "./aggregation.js";
import { chooseRecommendation } from "./chart-recommendation.js";
import { buildTimelineSpec } from "./spec-builders/buildTimelineSpec.js";
import { buildHistogramSpec } from "./spec-builders/buildHistogramSpec.js";
import { buildPieSpec } from "./spec-builders/buildPieSpec.js";
import { buildHeatmapSpec } from "./spec-builders/buildHeatmapSpec.js";
import { buildGenericSpec } from "./spec-builders/buildGenericSpec.js";

interface GenerateSpecInput {
  rows: DataRow[];
  schema: InferredSchema;
  intent?: string;
  chartType?: SupportedChartType;
  xField?: string;
  yField?: string;
  colorField?: string;
  title?: string;
  rowLimit?: number;
}

interface LargeDatasetMetadata {
  rowCount: number;
  rowLimit: number;
  fallbackApplied: boolean;
  fallbackStrategy?: string;
  suggestions: string[];
}

export interface GeneratedVegaSpec {
  recommendation: ChartRecommendation;
  spec: Record<string, unknown>;
  largeDataset?: LargeDatasetMetadata;
}

const DEFAULT_ROW_LIMIT = 10000;

const applyFieldHints = (
  recommendation: ChartRecommendation,
  schema: InferredSchema,
  hintXField?: string,
  hintYField?: string,
  hintColorField?: string
): ChartRecommendation => {
  const hasField = (name: string) => schema.fields.some((f) => f.name === name);
  return {
    ...recommendation,
    ...(hintXField && hasField(hintXField) ? { xField: hintXField } : {}),
    ...(hintYField && hasField(hintYField) ? { yField: hintYField } : {}),
    ...(hintColorField && hasField(hintColorField) ? { colorField: hintColorField } : {})
  };
};

const buildSpec = (
  rows: DataRow[],
  schema: InferredSchema,
  recommendation: ChartRecommendation,
  title: string,
  description: string
): Record<string, unknown> => {
  switch (recommendation.chartType) {
    case "timeline":
    case "gantt":
      return buildTimelineSpec(rows, schema, recommendation, title, description);
    case "histogram":
      return buildHistogramSpec(rows, recommendation, title, description);
    case "pie":
      return buildPieSpec(rows, recommendation, title, description);
    case "heatmap":
      return buildHeatmapSpec(rows, recommendation, title, description, schema);
    default:
      return buildGenericSpec(rows, schema, recommendation, title, description);
  }
};

export const generateVegaSpec = ({
  rows,
  schema,
  intent,
  chartType,
  xField: hintXField,
  yField: hintYField,
  colorField: hintColorField,
  title,
  rowLimit
}: GenerateSpecInput): GeneratedVegaSpec => {
  if (rows.length === 0) {
    throw new Error("Cannot generate a chart for an empty dataset.");
  }

  const resolvedRowLimit = rowLimit ? Math.max(1, Math.floor(rowLimit)) : DEFAULT_ROW_LIMIT;
  let workingRows = rows;
  let workingSchema = schema;
  let workingChartType = chartType;
  let largeDataset: LargeDatasetMetadata | undefined;

  if (rows.length > resolvedRowLimit) {
    const fallback = chooseLargeDatasetFallback(rows, schema);
    if (!fallback) {
      throw largeDatasetRequiresTransformationError(schema, rows.length, resolvedRowLimit);
    }
    workingRows = fallback.rows;
    workingSchema = fallback.schema;
    workingChartType = fallback.preferredChartType;
    largeDataset = {
      rowCount: rows.length,
      rowLimit: resolvedRowLimit,
      fallbackApplied: true,
      fallbackStrategy: fallback.strategy,
      suggestions: getUnsupportedDatasetSuggestions(schema, true)
    };
  }

  const recommendation = applyFieldHints(
    chooseRecommendation(workingSchema, workingChartType),
    workingSchema,
    hintXField,
    hintYField,
    hintColorField
  );

  const resolvedTitle = title ?? intent ?? `${recommendation.chartType} chart`;
  const resolvedDescription = largeDataset?.fallbackStrategy
    ? `${largeDataset.fallbackStrategy} ${intent ?? recommendation.reason}`
    : intent ?? recommendation.reason;

  return {
    recommendation,
    largeDataset,
    spec: buildSpec(workingRows, workingSchema, recommendation, resolvedTitle, resolvedDescription)
  };
};
