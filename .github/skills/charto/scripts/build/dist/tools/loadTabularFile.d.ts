import type { DataRow } from "../types.js";
export interface LoadedTabularFile {
    format: "csv";
    path: string;
    columns: string[];
    rows: DataRow[];
}
export declare const loadTabularFile: (filePath: string) => Promise<LoadedTabularFile>;
