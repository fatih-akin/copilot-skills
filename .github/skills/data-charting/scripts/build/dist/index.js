import path from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { generateVegaSpec } from "./tools/generateVegaSpec.js";
import { inferSchema } from "./tools/inferSchema.js";
import { loadTabularFile } from "./tools/loadTabularFile.js";
import { renderChartPreview } from "./tools/renderChartPreview.js";
import { suggestChartOptions } from "./tools/suggestChartOptions.js";
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
        fields: z.array(z.object({
            name: z.string(),
            type: z.enum(["number", "string", "date", "boolean"])
        }))
    }),
    intent: z.string().optional(),
    chartType: z.enum(["bar", "line", "scatter", "timeline", "gantt"]).optional(),
    title: z.string().optional(),
    rowLimit: z.number().int().positive().optional()
});
const suggestChartOptionsArgs = z.object({
    rows: z.array(z.record(z.union([z.string(), z.number(), z.boolean(), z.null()]))),
    schema: z.object({
        fields: z.array(z.object({
            name: z.string(),
            type: z.enum(["number", "string", "date", "boolean"])
        }))
    }),
    intent: z.string().optional(),
    rowLimit: z.number().int().positive().optional()
});
const renderChartPreviewArgs = z.object({
    spec: z.record(z.unknown()),
    title: z.string().min(1),
    outputName: z.string().min(1).default("chart-preview"),
    includePngBase64: z.boolean().optional()
});
const jsonResult = (payload) => ({
    content: [
        {
            type: "text",
            text: JSON.stringify(payload, null, 2)
        }
    ]
});
const server = new Server({
    name: "data-charting",
    version: "0.1.0"
}, {
    capabilities: {
        tools: {}
    }
});
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
            name: "suggest_chart_options",
            description: "Plan chart options from dataset schema with reasons and transformation recommendations.",
            inputSchema: {
                type: "object",
                properties: {
                    rows: { type: "array" },
                    schema: { type: "object" },
                    intent: { type: "string" },
                    rowLimit: {
                        type: "number",
                        description: "Optional row limit to activate large-dataset planning behavior."
                    }
                },
                required: ["rows", "schema"]
            }
        },
        {
            name: "generate_vega_spec",
            description: "Generate a Vega-Lite spec with large-dataset row-limit and auto-aggregation fallback support.",
            inputSchema: {
                type: "object",
                properties: {
                    rows: { type: "array" },
                    schema: { type: "object" },
                    intent: { type: "string" },
                    chartType: { type: "string", enum: ["bar", "line", "scatter", "timeline", "gantt"] },
                    title: { type: "string" },
                    rowLimit: {
                        type: "number",
                        description: "Optional max row count for direct plotting. If exceeded, auto-aggregation fallback is applied."
                    }
                },
                required: ["rows", "schema"]
            }
        },
        {
            name: "render_chart_preview",
            description: "Render a Vega-Lite spec into HTML and PNG preview artifacts with optional base64 output.",
            inputSchema: {
                type: "object",
                properties: {
                    spec: { type: "object" },
                    title: { type: "string" },
                    outputName: { type: "string" },
                    includePngBase64: {
                        type: "boolean",
                        description: "If false, skip returning pngBase64 to reduce response payload size."
                    }
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
        return jsonResult(generateVegaSpec({
            rows: parsed.rows,
            schema: parsed.schema,
            intent: parsed.intent,
            chartType: parsed.chartType,
            title: parsed.title,
            rowLimit: parsed.rowLimit
        }));
    }
    if (name === "suggest_chart_options") {
        const parsed = suggestChartOptionsArgs.parse(args ?? {});
        return jsonResult(suggestChartOptions({
            rows: parsed.rows,
            schema: parsed.schema,
            intent: parsed.intent,
            rowLimit: parsed.rowLimit
        }));
    }
    if (name === "render_chart_preview") {
        const parsed = renderChartPreviewArgs.parse(args ?? {});
        return jsonResult(await renderChartPreview(parsed.spec, parsed.title, path.resolve(workspaceRoot, "artifacts"), parsed.outputName, {
            includePngBase64: parsed.includePngBase64
        }));
    }
    throw new Error(`Unknown tool: ${name}`);
});
const main = async () => {
    const transport = new StdioServerTransport();
    await server.connect(transport);
};
main().catch((error) => {
    console.error(error);
    process.exit(1);
});
