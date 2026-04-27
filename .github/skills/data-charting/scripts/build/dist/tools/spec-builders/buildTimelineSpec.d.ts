import type { ChartRecommendation, DataRow, InferredSchema } from "../../types.js";
export declare const buildTimelineSpec: (rows: DataRow[], schema: InferredSchema, recommendation: ChartRecommendation, title: string, description: string) => Record<string, unknown>;
