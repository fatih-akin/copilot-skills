import type { DataRow, FieldType } from "../../types.js";
/**
 * Returns a Vega-Lite `width` value for the chart.
 * When x-axis is nominal and has many unique values, uses `{ step: N }` so
 * each bar gets a fixed pixel width and the chart expands horizontally —
 * capped at CANVAS_MAX_WIDTH to avoid Chrome canvas size crashes.
 * Otherwise returns a fixed 720px width.
 */
export declare const chartWidth: (rows: DataRow[], fieldName: string, fieldType?: FieldType) => number | {
    step: number;
};
/**
 * Returns an x-axis config object with label rotation when the field has
 * many unique categorical values that would otherwise overlap.
 * Only applies to nominal (string) fields — numeric/date axes don't need rotation.
 */
export declare const xAxisConfig: (rows: DataRow[], fieldName: string, fieldType?: FieldType, extraProps?: Record<string, unknown>) => Record<string, unknown>;
/**
 * Returns a y-axis config object with label truncation when the field has
 * many unique categorical values (e.g. timeline rows).
 * Only applies to nominal (string) fields.
 */
export declare const yAxisConfig: (rows: DataRow[], fieldName: string, fieldType?: FieldType, extraProps?: Record<string, unknown>) => Record<string, unknown>;
