import type { ChartRecommendation, DataRow, InferredSchema, SchemaField, SupportedChartType } from "../types.js";

interface GenerateSpecInput {
  rows: DataRow[];
  schema: InferredSchema;
  intent?: string;
  chartType?: SupportedChartType;
  title?: string;
}

interface VegaLiteFieldDef {
  field: string;
  type: "nominal" | "quantitative" | "temporal";
  title?: string;
}

export interface GeneratedVegaSpec {
  recommendation: ChartRecommendation;
  spec: Record<string, unknown>;
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

  throw new Error("The dataset does not have a supported field combination for bar, line, scatter, or timeline charts.");
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

export const generateVegaSpec = ({ rows, schema, intent, chartType, title }: GenerateSpecInput): GeneratedVegaSpec => {
  if (rows.length === 0) {
    throw new Error("Cannot generate a chart for an empty dataset.");
  }

  const recommendation = chooseRecommendation(schema, chartType);
  const xFieldSchema = schema.fields.find((field) => field.name === recommendation.xField);
  const yFieldSchema = schema.fields.find((field) => field.name === recommendation.yField);
  const endFieldSchema = recommendation.endField
    ? schema.fields.find((field) => field.name === recommendation.endField)
    : undefined;
  const colorFieldSchema = recommendation.colorField
    ? schema.fields.find((field) => field.name === recommendation.colorField)
    : undefined;

  if (!xFieldSchema || !yFieldSchema) {
    throw new Error("The selected chart fields are not present in the schema.");
  }

  const resolvedTitle = title ?? intent ?? `${recommendation.chartType} chart`;

  if (recommendation.chartType === "timeline") {
    if (!endFieldSchema) {
      throw new Error("A timeline chart requires an end date field.");
    }

    return {
      recommendation,
      spec: {
        $schema: "https://vega.github.io/schema/vega-lite/v5.json",
        description: intent ?? recommendation.reason,
        title: resolvedTitle,
        data: {
          values: rows
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
    spec: {
      $schema: "https://vega.github.io/schema/vega-lite/v5.json",
      description: intent ?? recommendation.reason,
      title: resolvedTitle,
      data: {
        values: rows
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
