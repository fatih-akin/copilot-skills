import { xAxisConfig, yAxisConfig } from "./axisUtils.js";
export const buildHeatmapSpec = (rows, recommendation, title, description, schema) => {
    const xFieldType = schema?.fields.find((f) => f.name === recommendation.xField)?.type ?? "string";
    const yFieldType = schema?.fields.find((f) => f.name === recommendation.yField)?.type ?? "string";
    return {
        $schema: "https://vega.github.io/schema/vega-lite/v5.json",
        description,
        title,
        data: { values: rows },
        width: 720,
        height: 420,
        mark: "rect",
        encoding: {
            x: { field: recommendation.xField, type: "nominal", title: recommendation.xField, ...xAxisConfig(rows, recommendation.xField, xFieldType) },
            y: { field: recommendation.yField, type: "nominal", title: recommendation.yField, ...yAxisConfig(rows, recommendation.yField, yFieldType) },
            color: recommendation.colorField
                ? { field: recommendation.colorField, type: "quantitative", title: recommendation.colorField }
                : { aggregate: "count", type: "quantitative", title: "Count" },
            tooltip: [
                { field: recommendation.xField, type: "nominal" },
                { field: recommendation.yField, type: "nominal" },
                ...(recommendation.colorField
                    ? [{ field: recommendation.colorField, type: "quantitative" }]
                    : [{ aggregate: "count", type: "quantitative", title: "Count" }])
            ]
        }
    };
};
