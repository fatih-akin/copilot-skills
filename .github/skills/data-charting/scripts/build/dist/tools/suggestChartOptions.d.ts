import type { DataRow, InferredSchema, SupportedChartType } from "../types.js";
interface SuggestChartOptionsInput {
    rows: DataRow[];
    schema: InferredSchema;
    intent?: string;
    rowLimit?: number;
}
interface TransformationPlan {
    kind: "none" | "group_count" | "group_sum_boolean";
    groupBy?: string[];
    valueField?: string;
    generatedValueField?: string;
    notes?: string;
}
export interface ChartOption {
    id: string;
    title: string;
    chartType: SupportedChartType;
    reason: string;
    requiresTransformation: boolean;
    transformation: TransformationPlan;
    recommended: boolean;
}
export interface SuggestedChartOptionsResult {
    rowCount: number;
    rowLimit: number;
    largeDatasetMode: boolean;
    options: ChartOption[];
    recommendedOptionId?: string;
    notes: string[];
}
export declare const suggestChartOptions: ({ rows, schema, intent, rowLimit }: SuggestChartOptionsInput) => SuggestedChartOptionsResult;
export {};
