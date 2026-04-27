const DEFAULT_ROW_LIMIT = 10000;
const pickCategoryField = (stringFields) => {
    if (stringFields.length === 0) {
        return undefined;
    }
    const preferredName = stringFields.find((field) => /status|type|team|base|location|operator|category|segment|country|city/i.test(field.name));
    if (preferredName) {
        return preferredName;
    }
    const nonIdField = stringFields.find((field) => !/(^id$|_id$|id_|code|register|slot|work_order|customer id)/i.test(field.name));
    return nonIdField ?? stringFields[0];
};
const pushDirectOptions = (schema, options) => {
    const dateFields = schema.fields.filter((field) => field.type === "date");
    const numberFields = schema.fields.filter((field) => field.type === "number");
    const stringFields = schema.fields.filter((field) => field.type === "string");
    if (dateFields.length > 0 && numberFields.length > 0) {
        options.push({
            id: "direct-line",
            title: `${dateFields[0].name} vs ${numberFields[0].name}`,
            chartType: "line",
            reason: `${dateFields[0].name} is temporal and ${numberFields[0].name} is numeric.`,
            requiresTransformation: false,
            transformation: { kind: "none" },
            recommended: true
        });
    }
    if (stringFields.length > 0 && numberFields.length > 0) {
        options.push({
            id: "direct-bar",
            title: `${stringFields[0].name} by ${numberFields[0].name}`,
            chartType: "bar",
            reason: `${stringFields[0].name} is categorical and ${numberFields[0].name} is numeric.`,
            requiresTransformation: false,
            transformation: { kind: "none" },
            recommended: false
        });
    }
    if (numberFields.length >= 2) {
        options.push({
            id: "direct-scatter",
            title: `${numberFields[0].name} vs ${numberFields[1].name}`,
            chartType: "scatter",
            reason: `Both ${numberFields[0].name} and ${numberFields[1].name} are numeric.`,
            requiresTransformation: false,
            transformation: { kind: "none" },
            recommended: false
        });
    }
    if (dateFields.length >= 2 && stringFields.length > 0) {
        options.push({
            id: "direct-timeline",
            title: `${stringFields[0].name} timeline (${dateFields[0].name} -> ${dateFields[1].name})`,
            chartType: "timeline",
            reason: `Two date fields (${dateFields[0].name}, ${dateFields[1].name}) and one category field (${stringFields[0].name}) are available.`,
            requiresTransformation: false,
            transformation: { kind: "none" },
            recommended: false
        });
    }
    if (dateFields.length > 0 && numberFields.length > 0) {
        options.push({
            id: "direct-area",
            title: `${dateFields[0].name} trend (area)`,
            chartType: "area",
            reason: `${dateFields[0].name} is temporal and ${numberFields[0].name} is numeric — area emphasizes cumulative magnitude.`,
            requiresTransformation: false,
            transformation: { kind: "none" },
            recommended: false
        });
    }
    if (numberFields.length > 0) {
        options.push({
            id: "direct-histogram",
            title: `Distribution of ${numberFields[0].name}`,
            chartType: "histogram",
            reason: `${numberFields[0].name} is numeric — a histogram reveals its value distribution and spread.`,
            requiresTransformation: false,
            transformation: { kind: "none" },
            recommended: false
        });
    }
    if (stringFields.length > 0 && numberFields.length > 0) {
        options.push({
            id: "direct-boxplot",
            title: `${numberFields[0].name} distribution by ${stringFields[0].name}`,
            chartType: "boxplot",
            reason: `${stringFields[0].name} is categorical and ${numberFields[0].name} is numeric — boxplot shows median, IQR, and outliers per group.`,
            requiresTransformation: false,
            transformation: { kind: "none" },
            recommended: false
        });
    }
};
const pushTransformedOptions = (schema, options, largeDatasetMode) => {
    const dateFields = schema.fields.filter((field) => field.type === "date");
    const stringFields = schema.fields.filter((field) => field.type === "string");
    const booleanFields = schema.fields.filter((field) => field.type === "boolean");
    const categoryField = pickCategoryField(stringFields);
    if (dateFields.length > 0) {
        options.push({
            id: "agg-date-count-line",
            title: `Daily/weekly count by ${dateFields[0].name}`,
            chartType: "line",
            reason: `Counting records over ${dateFields[0].name} creates a clean trend line${largeDatasetMode ? " for large datasets" : ""}.`,
            requiresTransformation: true,
            transformation: {
                kind: "group_count",
                groupBy: [dateFields[0].name],
                generatedValueField: "record_count",
                notes: "Optionally bucket by week for smoother trends."
            },
            recommended: largeDatasetMode
        });
    }
    if (dateFields.length > 0 && categoryField) {
        options.push({
            id: "agg-date-category-stacked-bar",
            title: `Stacked bar: ${dateFields[0].name} + ${categoryField.name}`,
            chartType: "bar",
            reason: `Date plus category shows composition changes over time.`,
            requiresTransformation: true,
            transformation: {
                kind: "group_count",
                groupBy: [dateFields[0].name, categoryField.name],
                generatedValueField: "record_count"
            },
            recommended: false
        });
    }
    if (booleanFields.length > 0 && categoryField) {
        options.push({
            id: "agg-category-boolean-sum-bar",
            title: `Sum of ${booleanFields[0].name} by ${categoryField.name}`,
            chartType: "bar",
            reason: `Boolean-to-0/1 summation turns ${booleanFields[0].name} into a measurable KPI.`,
            requiresTransformation: true,
            transformation: {
                kind: "group_sum_boolean",
                groupBy: [categoryField.name],
                valueField: booleanFields[0].name,
                generatedValueField: `${booleanFields[0].name}_sum`
            },
            recommended: false
        });
    }
    if (categoryField) {
        options.push({
            id: "agg-category-count-pie",
            title: `Pie chart: share by ${categoryField.name}`,
            chartType: "pie",
            reason: `Counting records by ${categoryField.name} shows proportional share — best with Top 10 filter for readability.`,
            requiresTransformation: true,
            transformation: {
                kind: "group_count",
                groupBy: [categoryField.name],
                generatedValueField: "record_count",
                notes: "Filter to Top 10 categories for readability."
            },
            recommended: false
        });
    }
    if (stringFields.length >= 2 && categoryField) {
        const secondField = stringFields.find((f) => f.name !== categoryField.name) ?? stringFields[1];
        options.push({
            id: "agg-two-category-heatmap",
            title: `Heatmap: ${categoryField.name} × ${secondField.name}`,
            chartType: "heatmap",
            reason: `Two categorical fields (${categoryField.name}, ${secondField.name}) can be crossed to show record density as a heatmap.`,
            requiresTransformation: true,
            transformation: {
                kind: "group_count",
                groupBy: [categoryField.name, secondField.name],
                generatedValueField: "record_count",
                notes: "Filter to top categories per axis to keep the grid readable."
            },
            recommended: false
        });
    }
};
export const suggestChartOptions = ({ rows, schema, intent, rowLimit }) => {
    if (rows.length === 0) {
        throw new Error("Cannot suggest chart options for an empty dataset.");
    }
    const resolvedRowLimit = rowLimit ? Math.max(1, Math.floor(rowLimit)) : DEFAULT_ROW_LIMIT;
    const largeDatasetMode = rows.length > resolvedRowLimit;
    const options = [];
    pushDirectOptions(schema, options);
    pushTransformedOptions(schema, options, largeDatasetMode);
    if (options.length === 0) {
        throw new Error("No chart options could be suggested. Add date, category, numeric, or boolean fields for chart planning.");
    }
    const recommendedOption = largeDatasetMode
        ? options.find((option) => option.requiresTransformation) ?? options[0]
        : options.find((option) => !option.requiresTransformation) ?? options[0];
    options.forEach((option) => {
        option.recommended = option.id === recommendedOption.id;
    });
    const notes = [
        ...(intent ? [`Intent considered: ${intent}`] : []),
        largeDatasetMode
            ? `Large dataset mode is active (${rows.length} > ${resolvedRowLimit}). Prefer transformed options.`
            : `Dataset size is within row limit (${rows.length} <= ${resolvedRowLimit}).`
    ];
    return {
        rowCount: rows.length,
        rowLimit: resolvedRowLimit,
        largeDatasetMode,
        options,
        recommendedOptionId: recommendedOption?.id,
        notes
    };
};
