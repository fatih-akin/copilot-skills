export const buildPieSpec = (rows, recommendation, title, description) => ({
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    description,
    title,
    data: { values: rows },
    width: 420,
    height: 420,
    mark: { type: "arc", innerRadius: 0 },
    encoding: {
        theta: { field: recommendation.yField, type: "quantitative", title: recommendation.yField },
        color: { field: recommendation.xField, type: "nominal", title: recommendation.xField },
        tooltip: [
            { field: recommendation.xField, type: "nominal" },
            { field: recommendation.yField, type: "quantitative" }
        ]
    }
});
