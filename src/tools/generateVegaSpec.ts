import type { ChartRecommendation, DataRow, InferredSchema, SchemaField, SupportedChartType } from "../types.js";

interface GenerateSpecInput {
  rows: DataRow[];
  schema: InferredSchema;
  intent?: string;
  chartType?: SupportedChartType;
  title?: string;
  rowLimit?: number;
}

interface VegaLiteFieldDef {
  field: string;
  type: "nominal" | "quantitative" | "temporal";
  title?: string;
}

interface LargeDatasetMetadata {
  rowCount: number;
  rowLimit: number;
  fallbackApplied: boolean;
  fallbackStrategy?: string;
  suggestions: string[];
}

interface AggregateFallback {
  rows: DataRow[];
  schema: InferredSchema;
  preferredChartType: SupportedChartType;
  strategy: string;
}

const DEFAULT_ROW_LIMIT = 5000;
const MAX_CATEGORY_BUCKETS = 30;

const joinFieldNames = (fields: SchemaField[]): string => (fields.length > 0 ? fields.map((field) => field.name).join(", ") : "none");

const pickCategoryField = (stringFields: SchemaField[]): SchemaField | undefined => {
  if (stringFields.length === 0) {
    return undefined;
  }

  const preferredName = stringFields.find((field) => /status|type|team|base|location|operator|category/i.test(field.name));
  if (preferredName) {
    return preferredName;
  }

  const nonIdField = stringFields.find((field) => !/(^id$|_id$|id_|code|register|slot|work_order)/i.test(field.name));
  return nonIdField ?? stringFields[0];
};

const getUnsupportedDatasetSuggestions = (schema: InferredSchema, largeDatasetMode = false): string[] => {
  const dateFields = schema.fields.filter((field) => field.type === "date");
  const stringFields = schema.fields.filter((field) => field.type === "string");
  const booleanFields = schema.fields.filter((field) => field.type === "boolean");
  const categoryField = pickCategoryField(stringFields);
  const suggestions: string[] = [];

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

const unsupportedDatasetError = (schema: InferredSchema): Error => {
  const dateFields = schema.fields.filter((field) => field.type === "date");
  const numberFields = schema.fields.filter((field) => field.type === "number");
  const stringFields = schema.fields.filter((field) => field.type === "string");
  const booleanFields = schema.fields.filter((field) => field.type === "boolean");
  const suggestions = getUnsupportedDatasetSuggestions(schema);

  const lines = [
    "The dataset does not have a supported field combination for bar, line, scatter, or timeline charts.",
    `Detected fields => date: ${joinFieldNames(dateFields)} | number: ${joinFieldNames(numberFields)} | string: ${joinFieldNames(stringFields)} | boolean: ${joinFieldNames(booleanFields)}`,
    "Suggested transformations:"
  ];

  if (suggestions.length === 0) {
    lines.push("- Add a numeric metric column (duration, cost, delay_hours, etc.) to unlock bar/line/scatter charts.");
  } else {
    suggestions.forEach((suggestion) => lines.push(`- ${suggestion}`));
  }

  return new Error(lines.join("\n"));
};

const largeDatasetRequiresTransformationError = (
  schema: InferredSchema,
  rowCount: number,
  rowLimit: number
): Error => {
  const suggestions = getUnsupportedDatasetSuggestions(schema, true);
  const lines = [
    `Large dataset mode triggered: ${rowCount} rows exceed the configured row limit (${rowLimit}).`,
    "A direct chart is disabled for performance reasons. Choose one of these transformations:"
  ];

  if (suggestions.length === 0) {
    lines.push("- Add a numeric metric column and aggregate before charting.");
  } else {
    suggestions.forEach((suggestion) => lines.push(`- ${suggestion}`));
  }

  return new Error(lines.join("\n"));
};

const aggregateByDateCount = (rows: DataRow[], dateFieldName: string): AggregateFallback | undefined => {
  const counts = new Map<string, number>();

  rows.forEach((row) => {
    const value = row[dateFieldName];
    if (typeof value === "string" && value.trim().length > 0) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  });

  if (counts.size === 0) {
    return undefined;
  }

  const aggregatedRows = [...counts.entries()]
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([dateValue, record_count]) => ({
      [dateFieldName]: dateValue,
      record_count
    }));

  return {
    rows: aggregatedRows,
    schema: {
      fields: [
        { name: dateFieldName, type: "date" },
        { name: "record_count", type: "number" }
      ]
    },
    preferredChartType: "line",
    strategy: `Auto-aggregated to daily counts by ${dateFieldName} for large dataset performance.`
  };
};

const aggregateByCategoryCount = (rows: DataRow[], categoryFieldName: string): AggregateFallback | undefined => {
  const counts = new Map<string, number>();

  rows.forEach((row) => {
    const value = row[categoryFieldName];
    if (typeof value === "string" && value.trim().length > 0) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  });

  if (counts.size === 0) {
    return undefined;
  }

  const aggregatedRows = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_CATEGORY_BUCKETS)
    .map(([categoryValue, record_count]) => ({
      [categoryFieldName]: categoryValue,
      record_count
    }));

  return {
    rows: aggregatedRows,
    schema: {
      fields: [
        { name: categoryFieldName, type: "string" },
        { name: "record_count", type: "number" }
      ]
    },
    preferredChartType: "bar",
    strategy: `Auto-aggregated to top ${MAX_CATEGORY_BUCKETS} category counts by ${categoryFieldName} for large dataset performance.`
  };
};

const chooseLargeDatasetFallback = (rows: DataRow[], schema: InferredSchema): AggregateFallback | undefined => {
  const dateField = schema.fields.find((field) => field.type === "date");
  if (dateField) {
    return aggregateByDateCount(rows, dateField.name);
  }

  const stringFields = schema.fields.filter((field) => field.type === "string");
  const categoryField = pickCategoryField(stringFields);
  if (categoryField) {
    return aggregateByCategoryCount(rows, categoryField.name);
  }

  const booleanField = schema.fields.find((field) => field.type === "boolean");
  if (booleanField) {
    const boolRows = rows.map((row) => ({
      [booleanField.name]: String(row[booleanField.name]),
      record_count: 1
    }));

    return aggregateByCategoryCount(boolRows, booleanField.name);
  }

  return undefined;
};

export interface GeneratedVegaSpec {
  recommendation: ChartRecommendation;
  spec: Record<string, unknown>;
  largeDataset?: LargeDatasetMetadata;
}

const chooseRecommendation = (schema: InferredSchema, requestedChartType?: SupportedChartType): ChartRecommendation => {
  const dateFields = schema.fields.filter((field) => field.type === "date");
  const numberFields = schema.fields.filter((field) => field.type === "number");
  const stringFields = schema.fields.filter((field) => field.type === "string");
  const dateField = dateFields[0];
  const stringField = stringFields[0];

  if (requestedChartType === "timeline" || requestedChartType === "gantt") {
    if (dateFields.length < 2 || stringFields.length === 0) {
      throw new Error("A timeline/gantt chart requires two date fields and one categorical field.");
    }
    return {
      chartType: "timeline",
      xField: dateFields[0].name,
      yField: stringFields[0].name,
      endField: dateFields[1].name,
      colorField: stringFields.find((field) => field.name !== stringFields[0].name)?.name,
      reason: `Selected a timeline chart because ${dateFields[0].name} and ${dateFields[1].name} form a date range and ${stringFields[0].name} is categorical.`
    };
  }

  if (requestedChartType === "line") {
    if (!dateField || numberFields.length === 0) {
      throw new Error("A line chart requires one date field and one numeric field.");
    }
    return {
      chartType: "line",
      xField: dateField.name,
      yField: numberFields[0].name,
      reason: `Selected a line chart because ${dateField.name} looks temporal and ${numberFields[0].name} is numeric.`
    };
  }

  if (requestedChartType === "bar") {
    if (!stringField || numberFields.length === 0) {
      throw new Error("A bar chart requires one categorical field and one numeric field.");
    }
    return {
      chartType: "bar",
      xField: stringField.name,
      yField: numberFields[0].name,
      reason: `Selected a bar chart because ${stringField.name} is categorical and ${numberFields[0].name} is numeric.`
    };
  }

  if (requestedChartType === "scatter") {
    if (numberFields.length < 2) {
      throw new Error("A scatter chart requires two numeric fields.");
    }
    return {
      chartType: "scatter",
      xField: numberFields[0].name,
      yField: numberFields[1].name,
      reason: `Selected a scatter plot because ${numberFields[0].name} and ${numberFields[1].name} are both numeric.`
    };
  }

  if (dateField && numberFields.length > 0) {
    return {
      chartType: "line",
      xField: dateField.name,
      yField: numberFields[0].name,
      reason: `Selected a line chart because ${dateField.name} looks temporal and ${numberFields[0].name} is numeric.`
    };
  }

  if (stringField && numberFields.length > 0) {
    return {
      chartType: "bar",
      xField: stringField.name,
      yField: numberFields[0].name,
      reason: `Selected a bar chart because ${stringField.name} is categorical and ${numberFields[0].name} is numeric.`
    };
  }

  if (numberFields.length >= 2) {
    return {
      chartType: "scatter",
      xField: numberFields[0].name,
      yField: numberFields[1].name,
      reason: `Selected a scatter plot because ${numberFields[0].name} and ${numberFields[1].name} are both numeric.`
    };
  }

  if (dateFields.length >= 2 && stringFields.length > 0) {
    return {
      chartType: "timeline",
      xField: dateFields[0].name,
      yField: stringFields[0].name,
      endField: dateFields[1].name,
      colorField: stringFields.find((field) => field.name !== stringFields[0].name)?.name,
      reason: `Selected a timeline chart because ${dateFields[0].name} and ${dateFields[1].name} form a date range and ${stringFields[0].name} is categorical.`
    };
  }

  throw unsupportedDatasetError(schema);
};

const toEncodingType = (fieldType: SchemaField["type"]): VegaLiteFieldDef["type"] => {
  if (fieldType === "number") {
    return "quantitative";
  }
  if (fieldType === "date") {
    return "temporal";
  }
  return "nominal";
};

export const generateVegaSpec = ({ rows, schema, intent, chartType, title, rowLimit }: GenerateSpecInput): GeneratedVegaSpec => {
  if (rows.length === 0) {
    throw new Error("Cannot generate a chart for an empty dataset.");
  }

  const resolvedRowLimit = rowLimit ? Math.max(1, Math.floor(rowLimit)) : DEFAULT_ROW_LIMIT;
  let workingRows = rows;
  let workingSchema = schema;
  let workingChartType = chartType;
  let largeDataset: LargeDatasetMetadata | undefined;

  if (rows.length > resolvedRowLimit) {
    const suggestions = getUnsupportedDatasetSuggestions(schema, true);
    const fallback = chooseLargeDatasetFallback(rows, schema);

    if (!fallback) {
      throw largeDatasetRequiresTransformationError(schema, rows.length, resolvedRowLimit);
    }

    workingRows = fallback.rows;
    workingSchema = fallback.schema;
    workingChartType = fallback.preferredChartType;
    largeDataset = {
      rowCount: rows.length,
      rowLimit: resolvedRowLimit,
      fallbackApplied: true,
      fallbackStrategy: fallback.strategy,
      suggestions
    };
  }

  const recommendation = chooseRecommendation(workingSchema, workingChartType);
  const xFieldSchema = workingSchema.fields.find((field) => field.name === recommendation.xField);
  const yFieldSchema = workingSchema.fields.find((field) => field.name === recommendation.yField);
  const endFieldSchema = recommendation.endField
    ? workingSchema.fields.find((field) => field.name === recommendation.endField)
    : undefined;
  const colorFieldSchema = recommendation.colorField
    ? workingSchema.fields.find((field) => field.name === recommendation.colorField)
    : undefined;

  if (!xFieldSchema || !yFieldSchema) {
    throw new Error("The selected chart fields are not present in the schema.");
  }

  const resolvedTitle = title ?? intent ?? `${recommendation.chartType} chart`;
  const resolvedDescription = largeDataset?.fallbackStrategy
    ? `${largeDataset.fallbackStrategy} ${intent ?? recommendation.reason}`
    : intent ?? recommendation.reason;

  if (recommendation.chartType === "timeline") {
    if (!endFieldSchema) {
      throw new Error("A timeline chart requires an end date field.");
    }

    return {
      recommendation,
      largeDataset,
      spec: {
        $schema: "https://vega.github.io/schema/vega-lite/v5.json",
        description: resolvedDescription,
        title: resolvedTitle,
        data: {
          values: workingRows
        },
        width: 720,
        height: 420,
        mark: "bar",
        encoding: {
          x: {
            field: recommendation.xField,
            type: "temporal",
            title: recommendation.xField
          },
          x2: {
            field: recommendation.endField
          },
          y: {
            field: recommendation.yField,
            type: toEncodingType(yFieldSchema.type),
            sort: { field: recommendation.xField, order: "ascending" },
            title: recommendation.yField
          },
          color: colorFieldSchema
            ? {
                field: recommendation.colorField,
                type: toEncodingType(colorFieldSchema.type),
                title: recommendation.colorField
              }
            : undefined,
          tooltip: [
            { field: recommendation.yField, type: toEncodingType(yFieldSchema.type) },
            { field: recommendation.xField, type: "temporal", title: "start" },
            { field: recommendation.endField, type: "temporal", title: "end" },
            ...(recommendation.colorField && colorFieldSchema
              ? [
                  {
                    field: recommendation.colorField,
                    type: toEncodingType(colorFieldSchema.type)
                  }
                ]
              : [])
          ]
        }
      }
    };
  }

  const mark = recommendation.chartType === "scatter" ? "point" : recommendation.chartType;

  return {
    recommendation,
    largeDataset,
    spec: {
      $schema: "https://vega.github.io/schema/vega-lite/v5.json",
      description: resolvedDescription,
      title: resolvedTitle,
      data: {
        values: workingRows
      },
      width: 720,
      height: 420,
      mark,
      encoding: {
        x: {
          field: recommendation.xField,
          type: toEncodingType(xFieldSchema.type),
          title: recommendation.xField
        },
        y: {
          field: recommendation.yField,
          type: toEncodingType(yFieldSchema.type),
          title: recommendation.yField
        },
        tooltip: [
          { field: recommendation.xField, type: toEncodingType(xFieldSchema.type) },
          { field: recommendation.yField, type: toEncodingType(yFieldSchema.type) }
        ]
      }
    }
  };
};
