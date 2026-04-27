import type { ChartRecommendation, DataRow, InferredSchema, SupportedChartType } from "../types.js";
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
export declare const generateVegaSpec: ({ rows, schema, intent, chartType, xField: hintXField, yField: hintYField, colorField: hintColorField, title, rowLimit }: GenerateSpecInput) => GeneratedVegaSpec;
export {};
