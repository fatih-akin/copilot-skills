import type { ChartRecommendation, InferredSchema, SchemaField, SupportedChartType } from "../types.js";
export declare const toEncodingType: (fieldType: SchemaField["type"]) => "nominal" | "quantitative" | "temporal";
export declare const chooseRecommendation: (schema: InferredSchema, requestedChartType?: SupportedChartType) => ChartRecommendation;
