import type { ChartRecommendation, DataRow, InferredSchema } from "../../types.js";
export declare const buildHeatmapSpec: (rows: DataRow[], recommendation: ChartRecommendation, title: string, description: string, schema?: InferredSchema) => Record<string, unknown>;
