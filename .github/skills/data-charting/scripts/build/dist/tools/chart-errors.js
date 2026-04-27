const joinFieldNames = (fields) => fields.length > 0 ? fields.map((f) => f.name).join(", ") : "none";
export const getUnsupportedDatasetSuggestions = (schema, largeDatasetMode = false) => {
    const dateFields = schema.fields.filter((f) => f.type === "date");
    const stringFields = schema.fields.filter((f) => f.type === "string");
    const booleanFields = schema.fields.filter((f) => f.type === "boolean");
    const categoryField = stringFields.find((f) => /status|type|team|base|location|operator|category|segment|country|city/i.test(f.name))
        ?? stringFields.find((f) => !/(^id$|_id$|id_|code|register|slot|work_order|customer id)/i.test(f.name))
        ?? stringFields[0];
    const suggestions = [];
    if (categoryField) {
        suggestions.push(`Count records by ${categoryField.name} and use a bar chart${largeDatasetMode ? " (top categories only)" : ""}.`);
    }
    if (dateFields.length > 0) {
        suggestions.push(`Aggregate daily/weekly counts by ${dateFields[0].name} and use a line chart.`);
    }
    if (dateFields.length > 0 && categoryField) {
        suggestions.push(`Group by ${dateFields[0].name} + ${categoryField.name} and visualize with a stacked bar chart.`);
    }
    if (dateFields.length === 1 && categoryField) {
        suggestions.push(`Add an end-date column for each ${categoryField.name} item to enable a timeline/gantt chart.`);
    }
    if (booleanFields.length > 0) {
        suggestions.push(`Convert ${booleanFields[0].name} to 0/1 and aggregate by category for a bar chart.`);
    }
    return suggestions;
};
export const unsupportedDatasetError = (schema) => {
    const dateFields = schema.fields.filter((f) => f.type === "date");
    const numberFields = schema.fields.filter((f) => f.type === "number");
    const stringFields = schema.fields.filter((f) => f.type === "string");
    const booleanFields = schema.fields.filter((f) => f.type === "boolean");
    const suggestions = getUnsupportedDatasetSuggestions(schema);
    const lines = [
        "The dataset does not have a supported field combination for bar, line, scatter, or timeline charts.",
        `Detected fields => date: ${joinFieldNames(dateFields)} | number: ${joinFieldNames(numberFields)} | string: ${joinFieldNames(stringFields)} | boolean: ${joinFieldNames(booleanFields)}`,
        "Suggested transformations:",
        ...(suggestions.length === 0
            ? ["- Add a numeric metric column (duration, cost, delay_hours, etc.) to unlock bar/line/scatter charts."]
            : suggestions.map((s) => `- ${s}`))
    ];
    return new Error(lines.join("\n"));
};
export const largeDatasetRequiresTransformationError = (schema, rowCount, rowLimit) => {
    const suggestions = getUnsupportedDatasetSuggestions(schema, true);
    const lines = [
        `Large dataset mode triggered: ${rowCount} rows exceed the configured row limit (${rowLimit}).`,
        "A direct chart is disabled for performance reasons. Choose one of these transformations:",
        ...(suggestions.length === 0
            ? ["- Add a numeric metric column and aggregate before charting."]
            : suggestions.map((s) => `- ${s}`))
    ];
    return new Error(lines.join("\n"));
};
