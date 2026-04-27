import type { ChartRecommendation, DataRow, InferredSchema } from "../../types.js";
/** Handles bar, line, area, scatter, and boxplot — all use x/y encodings directly. */
export declare const buildGenericSpec: (rows: DataRow[], schema: InferredSchema, recommendation: ChartRecommendation, title: string, description: string) => Record<string, unknown>;
