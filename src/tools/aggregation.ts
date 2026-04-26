import type { DataRow, InferredSchema, SupportedChartType } from "../types.js";

export interface AggregateFallback {
  rows: DataRow[];
  schema: InferredSchema;
  preferredChartType: SupportedChartType;
  strategy: string;
}

const MAX_CATEGORY_BUCKETS = 30;

const pickCategoryField = (schema: InferredSchema): string | undefined => {
  const stringFields = schema.fields.filter((f) => f.type === "string");
  const preferred = stringFields.find((f) => /status|type|team|base|location|operator|category|segment|country|city/i.test(f.name));
  if (preferred) return preferred.name;
  return stringFields.find((f) => !/(^id$|_id$|id_|code|register|slot|work_order|customer id)/i.test(f.name))?.name ?? stringFields[0]?.name;
};

export const aggregateByDateCount = (rows: DataRow[], dateFieldName: string): AggregateFallback | undefined => {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const value = row[dateFieldName];
    if (typeof value === "string" && value.trim().length > 0) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }
  if (counts.size === 0) return undefined;

  const aggregatedRows = [...counts.entries()]
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([dateValue, record_count]) => ({ [dateFieldName]: dateValue, record_count }));

  return {
    rows: aggregatedRows,
    schema: { fields: [{ name: dateFieldName, type: "date" }, { name: "record_count", type: "number" }] },
    preferredChartType: "line",
    strategy: `Auto-aggregated to daily counts by ${dateFieldName} for large dataset performance.`
  };
};

export const aggregateByCategoryCount = (rows: DataRow[], categoryFieldName: string): AggregateFallback | undefined => {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const value = row[categoryFieldName];
    if (typeof value === "string" && value.trim().length > 0) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }
  if (counts.size === 0) return undefined;

  const aggregatedRows = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_CATEGORY_BUCKETS)
    .map(([categoryValue, record_count]) => ({ [categoryFieldName]: categoryValue, record_count }));

  return {
    rows: aggregatedRows,
    schema: { fields: [{ name: categoryFieldName, type: "string" }, { name: "record_count", type: "number" }] },
    preferredChartType: "bar",
    strategy: `Auto-aggregated to top ${MAX_CATEGORY_BUCKETS} category counts by ${categoryFieldName} for large dataset performance.`
  };
};

export const chooseLargeDatasetFallback = (rows: DataRow[], schema: InferredSchema): AggregateFallback | undefined => {
  const dateField = schema.fields.find((f) => f.type === "date");
  if (dateField) return aggregateByDateCount(rows, dateField.name);

  const categoryFieldName = pickCategoryField(schema);
  if (categoryFieldName) return aggregateByCategoryCount(rows, categoryFieldName);

  const booleanField = schema.fields.find((f) => f.type === "boolean");
  if (booleanField) {
    const boolRows = rows.map((row) => ({ [booleanField.name]: String(row[booleanField.name]), record_count: 1 }));
    return aggregateByCategoryCount(boolRows, booleanField.name);
  }

  return undefined;
};
