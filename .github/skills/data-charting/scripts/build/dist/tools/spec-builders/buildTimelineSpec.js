import { toEncodingType } from "../chart-recommendation.js";
import { yAxisConfig } from "./axisUtils.js";
export const buildTimelineSpec = (rows, schema, recommendation, title, description) => {
    const yFieldSchema = schema.fields.find((f) => f.name === recommendation.yField);
    const colorFieldSchema = recommendation.colorField
        ? schema.fields.find((f) => f.name === recommendation.colorField)
        : undefined;
    if (!recommendation.endField) {
        throw new Error("A timeline chart requires an end date field.");
    }
    return {
        $schema: "https://vega.github.io/schema/vega-lite/v5.json",
        description,
        title,
        data: { values: rows },
        width: 720,
        height: 420,
        mark: "bar",
        encoding: {
            x: { field: recommendation.xField, type: "temporal", title: recommendation.xField },
            x2: { field: recommendation.endField },
            y: {
                field: recommendation.yField,
                type: toEncodingType(yFieldSchema.type),
                sort: { field: recommendation.xField, order: "ascending" },
                title: recommendation.yField,
                ...yAxisConfig(rows, recommendation.yField, yFieldSchema.type)
            },
            color: colorFieldSchema
                ? { field: recommendation.colorField, type: toEncodingType(colorFieldSchema.type), title: recommendation.colorField }
                : undefined,
            tooltip: [
                { field: recommendation.yField, type: toEncodingType(yFieldSchema.type) },
                { field: recommendation.xField, type: "temporal", title: "start" },
                { field: recommendation.endField, type: "temporal", title: "end" },
                ...(recommendation.colorField && colorFieldSchema
                    ? [{ field: recommendation.colorField, type: toEncodingType(colorFieldSchema.type) }]
                    : [])
            ]
        }
    };
};
