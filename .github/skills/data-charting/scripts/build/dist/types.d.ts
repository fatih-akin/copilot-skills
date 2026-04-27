export type PrimitiveValue = string | number | boolean | null;
export type DataRow = Record<string, PrimitiveValue>;
export type FieldType = "number" | "string" | "date" | "boolean";
export interface SchemaField {
    name: string;
    type: FieldType;
}
export interface InferredSchema {
    fields: SchemaField[];
}
export type SupportedChartType = "bar" | "line" | "scatter" | "timeline" | "gantt" | "area" | "pie" | "histogram" | "boxplot" | "heatmap";
export interface ChartRecommendation {
    chartType: SupportedChartType;
    xField: string;
    yField: string;
    endField?: string;
    colorField?: string;
    reason: string;
}
