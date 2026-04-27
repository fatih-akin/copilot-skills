import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";
const normalizeCell = (value) => {
    if (typeof value !== "string") {
        return null;
    }
    const trimmed = value.trim();
    if (trimmed.length === 0) {
        return null;
    }
    if (trimmed === "true" || trimmed === "false") {
        return trimmed === "true";
    }
    const asNumber = Number(trimmed);
    if (!Number.isNaN(asNumber) && trimmed !== "") {
        return asNumber;
    }
    return trimmed;
};
export const loadTabularFile = async (filePath) => {
    const extension = path.extname(filePath).toLowerCase();
    if (extension !== ".csv") {
        throw new Error(`Unsupported file format: ${extension || "unknown"}. This MVP only supports CSV.`);
    }
    const fileContents = await readFile(filePath, "utf8");
    const records = parse(fileContents, {
        columns: true,
        skip_empty_lines: true,
        trim: true
    });
    if (records.length === 0) {
        throw new Error("The CSV file does not contain any data rows.");
    }
    const columns = Object.keys(records[0]);
    const rows = records.map((record) => {
        const normalized = Object.fromEntries(columns.map((column) => [column, normalizeCell(record[column])]));
        return normalized;
    });
    return {
        format: "csv",
        path: filePath,
        columns,
        rows
    };
};
