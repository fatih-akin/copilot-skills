import type { DataRow, InferredSchema, SupportedChartType } from "../types.js";
export interface AggregateFallback {
    rows: DataRow[];
    schema: InferredSchema;
    preferredChartType: SupportedChartType;
    strategy: string;
}
export declare const aggregateByDateCount: (rows: DataRow[], dateFieldName: string) => AggregateFallback | undefined;
export declare const aggregateByCategoryCount: (rows: DataRow[], categoryFieldName: string) => AggregateFallback | undefined;
export declare const chooseLargeDatasetFallback: (rows: DataRow[], schema: InferredSchema) => AggregateFallback | undefined;
