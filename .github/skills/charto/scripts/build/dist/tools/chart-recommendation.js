import { unsupportedDatasetError } from "./chart-errors.js";
export const toEncodingType = (fieldType) => {
    if (fieldType === "number")
        return "quantitative";
    if (fieldType === "date")
        return "temporal";
    return "nominal";
};
const buildLineRecommendation = (schema) => {
    const dateField = schema.fields.find((f) => f.type === "date");
    const numberField = schema.fields.find((f) => f.type === "number");
    if (!dateField || !numberField)
        throw new Error("A line chart requires one date field and one numeric field.");
    return { chartType: "line", xField: dateField.name, yField: numberField.name, reason: `Selected a line chart because ${dateField.name} looks temporal and ${numberField.name} is numeric.` };
};
const buildBarRecommendation = (schema) => {
    const stringField = schema.fields.find((f) => f.type === "string");
    const numberField = schema.fields.find((f) => f.type === "number");
    if (!stringField || !numberField)
        throw new Error("A bar chart requires one categorical field and one numeric field.");
    return { chartType: "bar", xField: stringField.name, yField: numberField.name, reason: `Selected a bar chart because ${stringField.name} is categorical and ${numberField.name} is numeric.` };
};
const buildScatterRecommendation = (schema) => {
    const numberFields = schema.fields.filter((f) => f.type === "number");
    if (numberFields.length < 2)
        throw new Error("A scatter chart requires two numeric fields.");
    return { chartType: "scatter", xField: numberFields[0].name, yField: numberFields[1].name, reason: `Selected a scatter plot because ${numberFields[0].name} and ${numberFields[1].name} are both numeric.` };
};
const buildTimelineRecommendation = (schema) => {
    const dateFields = schema.fields.filter((f) => f.type === "date");
    const stringFields = schema.fields.filter((f) => f.type === "string");
    if (dateFields.length < 2 || stringFields.length === 0)
        throw new Error("A timeline/gantt chart requires two date fields and one categorical field.");
    return {
        chartType: "timeline",
        xField: dateFields[0].name,
        yField: stringFields[0].name,
        endField: dateFields[1].name,
        colorField: stringFields.find((f) => f.name !== stringFields[0].name)?.name,
        reason: `Selected a timeline chart because ${dateFields[0].name} and ${dateFields[1].name} form a date range and ${stringFields[0].name} is categorical.`
    };
};
const buildAreaRecommendation = (schema) => {
    const dateField = schema.fields.find((f) => f.type === "date");
    const numberField = schema.fields.find((f) => f.type === "number");
    if (!dateField || !numberField)
        throw new Error("An area chart requires one date field and one numeric field.");
    return { chartType: "area", xField: dateField.name, yField: numberField.name, reason: `Selected an area chart because ${dateField.name} looks temporal and ${numberField.name} is numeric.` };
};
const buildHistogramRecommendation = (schema) => {
    const numberField = schema.fields.find((f) => f.type === "number");
    if (!numberField)
        throw new Error("A histogram requires at least one numeric field.");
    return { chartType: "histogram", xField: numberField.name, yField: "count", reason: `Selected a histogram to show the distribution of ${numberField.name}.` };
};
const buildPieRecommendation = (schema) => {
    const stringField = schema.fields.find((f) => f.type === "string");
    const numberField = schema.fields.find((f) => f.type === "number");
    if (!stringField || !numberField)
        throw new Error("A pie chart requires one categorical field and one numeric field.");
    return { chartType: "pie", xField: stringField.name, yField: numberField.name, reason: `Selected a pie chart because ${stringField.name} is categorical and ${numberField.name} is numeric.` };
};
const buildBoxplotRecommendation = (schema) => {
    const stringField = schema.fields.find((f) => f.type === "string");
    const numberField = schema.fields.find((f) => f.type === "number");
    if (!stringField || !numberField)
        throw new Error("A boxplot requires one categorical field and one numeric field.");
    return { chartType: "boxplot", xField: stringField.name, yField: numberField.name, reason: `Selected a boxplot to show the distribution of ${numberField.name} across ${stringField.name} categories.` };
};
const buildHeatmapRecommendation = (schema) => {
    const stringFields = schema.fields.filter((f) => f.type === "string");
    const numberField = schema.fields.find((f) => f.type === "number");
    if (stringFields.length < 2 || !numberField)
        throw new Error("A heatmap requires two categorical fields and one numeric field.");
    return { chartType: "heatmap", xField: stringFields[0].name, yField: stringFields[1].name, colorField: numberField.name, reason: `Selected a heatmap with ${stringFields[0].name} × ${stringFields[1].name} intensity encoded by ${numberField.name}.` };
};
const RECOMMENDATION_BUILDERS = {
    line: buildLineRecommendation,
    bar: buildBarRecommendation,
    scatter: buildScatterRecommendation,
    timeline: buildTimelineRecommendation,
    gantt: buildTimelineRecommendation,
    area: buildAreaRecommendation,
    histogram: buildHistogramRecommendation,
    pie: buildPieRecommendation,
    boxplot: buildBoxplotRecommendation,
    heatmap: buildHeatmapRecommendation
};
const autoDetectRecommendation = (schema) => {
    const dateField = schema.fields.find((f) => f.type === "date");
    const numberFields = schema.fields.filter((f) => f.type === "number");
    const stringFields = schema.fields.filter((f) => f.type === "string");
    const dateFields = schema.fields.filter((f) => f.type === "date");
    if (dateField && numberFields.length > 0)
        return buildLineRecommendation(schema);
    if (stringFields.length > 0 && numberFields.length > 0)
        return buildBarRecommendation(schema);
    if (numberFields.length >= 2)
        return buildScatterRecommendation(schema);
    if (dateFields.length >= 2 && stringFields.length > 0)
        return buildTimelineRecommendation(schema);
    throw unsupportedDatasetError(schema);
};
export const chooseRecommendation = (schema, requestedChartType) => {
    if (!requestedChartType)
        return autoDetectRecommendation(schema);
    const builder = RECOMMENDATION_BUILDERS[requestedChartType];
    if (!builder)
        return autoDetectRecommendation(schema);
    return builder(schema);
};
