import path from "node:path";
import { loadTabularFile } from "../dist/tools/loadTabularFile.js";
import { inferSchema } from "../dist/tools/inferSchema.js";
import { suggestChartOptions } from "../dist/tools/suggestChartOptions.js";
import { generateVegaSpec } from "../dist/tools/generateVegaSpec.js";
import { renderChartPreview } from "../dist/tools/renderChartPreview.js";

const parseArgs = (argv) => {
  const parsed = {};

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      parsed[key] = next;
      i += 1;
    } else {
      parsed[key] = "true";
    }
  }

  return parsed;
};

const groupCount = (rows, groupBy, generatedField) => {
  const map = new Map();

  for (const row of rows) {
    const keyValues = groupBy.map((k) => String(row[k] ?? ""));
    const key = JSON.stringify(keyValues);
    map.set(key, (map.get(key) ?? 0) + 1);
  }

  return Array.from(map.entries()).map(([key, value]) => {
    const values = JSON.parse(key);
    const record = {};
    groupBy.forEach((g, i) => {
      record[g] = values[i];
    });
    record[generatedField] = value;
    return record;
  });
};

const groupSumBoolean = (rows, groupBy, valueField, generatedField) => {
  const map = new Map();

  for (const row of rows) {
    const keyValues = groupBy.map((k) => String(row[k] ?? ""));
    const key = JSON.stringify(keyValues);
    const raw = row[valueField];
    const asBool = raw === true || raw === 1 || raw === "1" || String(raw).toLowerCase() === "true";
    map.set(key, (map.get(key) ?? 0) + (asBool ? 1 : 0));
  }

  return Array.from(map.entries()).map(([key, value]) => {
    const values = JSON.parse(key);
    const record = {};
    groupBy.forEach((g, i) => {
      record[g] = values[i];
    });
    record[generatedField] = value;
    return record;
  });
};

const maybeTransformRows = (rows, selectedOption) => {
  if (!selectedOption.requiresTransformation) {
    return rows;
  }

  const { transformation } = selectedOption;

  if (transformation.kind === "group_count" && transformation.groupBy?.length) {
    const generatedField = transformation.generatedValueField ?? "record_count";
    let transformed = groupCount(rows, transformation.groupBy, generatedField);

    if (selectedOption.chartType === "pie") {
      transformed = transformed
        .sort((a, b) => Number(b[generatedField]) - Number(a[generatedField]))
        .slice(0, 10);
    }

    return transformed;
  }

  if (
    transformation.kind === "group_sum_boolean" &&
    transformation.groupBy?.length &&
    transformation.valueField
  ) {
    const generatedField = transformation.generatedValueField ?? `${transformation.valueField}_sum`;
    return groupSumBoolean(rows, transformation.groupBy, transformation.valueField, generatedField);
  }

  return rows;
};

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const printUsage = () => {
  console.log("Usage: npm run chart:build -- --dataset <path> [--rowLimit 10000] [--optionId <id>] [--output <name>] [--title <text>] [--inline true]");
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  const dataset = args.dataset;

  if (!dataset) {
    printUsage();
    throw new Error("Missing required argument: --dataset");
  }

  const rowLimit = args.rowLimit ? Number(args.rowLimit) : 10000;
  if (!Number.isFinite(rowLimit) || rowLimit <= 0) {
    throw new Error("--rowLimit must be a positive number.");
  }

  const includeInlineBase64 = String(args.inline ?? "false") === "true";

  const loaded = await loadTabularFile(dataset);
  const schema = inferSchema(loaded.rows);
  const planned = suggestChartOptions({ rows: loaded.rows, schema, rowLimit });

  const selected = args.optionId
    ? planned.options.find((option) => option.id === args.optionId)
    : planned.options.find((option) => option.id === planned.recommendedOptionId) ?? planned.options[0];

  if (!selected) {
    throw new Error("No chart option could be selected.");
  }

  if (args.optionId && !planned.options.some((option) => option.id === args.optionId)) {
    const optionIds = planned.options.map((option) => option.id).join(", ");
    throw new Error(`Unknown --optionId '${args.optionId}'. Available options: ${optionIds}`);
  }

  const transformedRows = maybeTransformRows(loaded.rows, selected);
  const transformedSchema = inferSchema(transformedRows);

  const datasetName = path.basename(dataset, path.extname(dataset));
  const outputName = args.output ?? `${slugify(datasetName)}-${selected.id}`;
  const title = args.title ?? `${datasetName} - ${selected.id}`;

  const generated = generateVegaSpec({
    rows: transformedRows,
    schema: transformedSchema,
    chartType: selected.chartType,
    rowLimit,
    title
  });

  const preview = await renderChartPreview(
    generated.spec,
    title,
    path.join(process.cwd(), "artifacts"),
    outputName,
    { includePngBase64: includeInlineBase64 }
  );

  const payload = {
    datasetPath: loaded.path,
    rowLimit,
    planner: {
      rowCount: planned.rowCount,
      largeDatasetMode: planned.largeDatasetMode,
      recommendedOptionId: planned.recommendedOptionId
    },
    selectedOption: selected,
    transformedRowCount: transformedRows.length,
    largeDataset: generated.largeDataset ?? null,
    preview
  };

  console.log(JSON.stringify(payload, null, 2));
};

main().catch((error) => {
  console.error(`chart:build failed: ${error.message}`);
  process.exit(1);
});
