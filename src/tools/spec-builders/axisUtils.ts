import type { DataRow, FieldType } from "../../types.js";

const LABEL_ANGLE_THRESHOLD = 20;
const LABEL_ANGLE_DIAGONAL = -45;
const LABEL_LIMIT_DIAGONAL = 120;

/** Minimum px per bar step when chart auto-expands for many categorical values */
const BAR_STEP_PX = 20;
/** Browser canvas max safe width (Chrome limit ~32767px; stay well under) */
const CANVAS_MAX_WIDTH = 16000;

/**
 * Returns a Vega-Lite `width` value for the chart.
 * When x-axis is nominal and has many unique values, uses `{ step: N }` so
 * each bar gets a fixed pixel width and the chart expands horizontally —
 * capped at CANVAS_MAX_WIDTH to avoid Chrome canvas size crashes.
 * Otherwise returns a fixed 720px width.
 */
export const chartWidth = (
  rows: DataRow[],
  fieldName: string,
  fieldType: FieldType = "string"
): number | { step: number } => {
  const isNominal = fieldType === "string" || fieldType === "boolean";
  if (!isNominal) return 720;
  const uniqueCount = new Set(rows.map((r) => r[fieldName])).size;
  if (uniqueCount <= LABEL_ANGLE_THRESHOLD) return 720;
  const stepWidth = uniqueCount * BAR_STEP_PX;
  return stepWidth <= CANVAS_MAX_WIDTH ? { step: BAR_STEP_PX } : CANVAS_MAX_WIDTH;
};

/**
 * Returns an x-axis config object with label rotation when the field has
 * many unique categorical values that would otherwise overlap.
 * Only applies to nominal (string) fields — numeric/date axes don't need rotation.
 */
export const xAxisConfig = (
  rows: DataRow[],
  fieldName: string,
  fieldType: FieldType = "string",
  extraProps: Record<string, unknown> = {}
): Record<string, unknown> => {
  const isNominal = fieldType === "string" || fieldType === "boolean";
  const uniqueCount = isNominal ? new Set(rows.map((r) => r[fieldName])).size : 0;
  const needsRotation = isNominal && uniqueCount > LABEL_ANGLE_THRESHOLD;

  return {
    ...extraProps,
    ...(needsRotation
      ? { axis: { labelAngle: LABEL_ANGLE_DIAGONAL, labelLimit: LABEL_LIMIT_DIAGONAL } }
      : {})
  };
};

/**
 * Returns a y-axis config object with label truncation when the field has
 * many unique categorical values (e.g. timeline rows).
 * Only applies to nominal (string) fields.
 */
export const yAxisConfig = (
  rows: DataRow[],
  fieldName: string,
  fieldType: FieldType = "string",
  extraProps: Record<string, unknown> = {}
): Record<string, unknown> => {
  const isNominal = fieldType === "string" || fieldType === "boolean";
  const uniqueCount = isNominal ? new Set(rows.map((r) => r[fieldName])).size : 0;
  const needsTruncation = isNominal && uniqueCount > LABEL_ANGLE_THRESHOLD;

  return {
    ...extraProps,
    ...(needsTruncation ? { axis: { labelLimit: 160 } } : {})
  };
};
