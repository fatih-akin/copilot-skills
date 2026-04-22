import path from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolResult
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { generateVegaSpec } from "./tools/generateVegaSpec.js";
import { inferSchema } from "./tools/inferSchema.js";
import { loadTabularFile } from "./tools/loadTabularFile.js";
import { renderChartPreview } from "./tools/renderChartPreview.js";
import type { SupportedChartType } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "..");

const loadTabularFileArgs = z.object({
  path: z.string().min(1)
});

const inferSchemaArgs = z.object({
  rows: z.array(z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])))
});

const generateVegaSpecArgs = z.object({
  rows: z.array(z.record(z.union([z.string(), z.number(), z.boolean(), z.null()]))),
  schema: z.object({
    fields: z.array(
      z.object({
        name: z.string(),
        type: z.enum(["number", "string", "date", "boolean"])
      })
    )
  }),
  intent: z.string().optional(),
  chartType: z.enum(["bar", "line", "scatter", "timeline", "gantt"]).optional(),
  title: z.string().optional()
});

const renderChartPreviewArgs = z.object({
  spec: z.record(z.unknown()),
  title: z.string().min(1),
  outputName: z.string().min(1).default("chart-preview")
});

const jsonResult = (payload: unknown): CallToolResult => ({
  content: [
    {
      type: "text",
      text: JSON.stringify(payload, null, 2)
    }
  ]
});

const server = new Server(
  {
    name: "vega-data-charting",
    version: "0.1.0"
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "load_tabular_file",
      description: "Load a CSV file from disk and return structured rows and columns.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "Absolute or workspace-relative path to a CSV file." }
        },
        required: ["path"]
      }
    },
    {
      name: "infer_schema",
      description: "Infer simple field types from tabular rows.",
      inputSchema: {
        type: "object",
        properties: {
          rows: {
            type: "array",
            description: "Dataset rows returned by load_tabular_file."
          }
        },
        required: ["rows"]
      }
    },
    {
      name: "generate_vega_spec",
      description: "Generate a Vega-Lite spec for bar, line, scatter, or timeline/gantt charts.",
      inputSchema: {
        type: "object",
        properties: {
          rows: { type: "array" },
          schema: { type: "object" },
          intent: { type: "string" },
          chartType: { type: "string", enum: ["bar", "line", "scatter", "timeline", "gantt"] },
          title: { type: "string" }
        },
        required: ["rows", "schema"]
      }
    },
    {
      name: "render_chart_preview",
      description: "Render a Vega-Lite spec into an HTML preview artifact.",
      inputSchema: {
        type: "object",
        properties: {
          spec: { type: "object" },
          title: { type: "string" },
          outputName: { type: "string" }
        },
        required: ["spec", "title"]
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "load_tabular_file") {
    const parsed = loadTabularFileArgs.parse(args ?? {});
    const resolvedPath = path.isAbsolute(parsed.path)
      ? parsed.path
      : path.resolve(workspaceRoot, parsed.path);
    return jsonResult(await loadTabularFile(resolvedPath));
  }

  if (name === "infer_schema") {
    const parsed = inferSchemaArgs.parse(args ?? {});
    return jsonResult(inferSchema(parsed.rows));
  }

  if (name === "generate_vega_spec") {
    const parsed = generateVegaSpecArgs.parse(args ?? {});
    return jsonResult(
      generateVegaSpec({
        rows: parsed.rows,
        schema: parsed.schema,
        intent: parsed.intent,
        chartType: parsed.chartType as SupportedChartType | undefined,
        title: parsed.title
      })
    );
  }

  if (name === "render_chart_preview") {
    const parsed = renderChartPreviewArgs.parse(args ?? {});
    return jsonResult(
      await renderChartPreview(
        parsed.spec,
        parsed.title,
        path.resolve(workspaceRoot, "artifacts"),
        parsed.outputName
      )
    );
  }

  throw new Error(`Unknown tool: ${name}`);
});

const main = async (): Promise<void> => {
  const transport = new StdioServerTransport();
  await server.connect(transport);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});