import type { InferredSchema } from "../types.js";
export declare const getUnsupportedDatasetSuggestions: (schema: InferredSchema, largeDatasetMode?: boolean) => string[];
export declare const unsupportedDatasetError: (schema: InferredSchema) => Error;
export declare const largeDatasetRequiresTransformationError: (schema: InferredSchema, rowCount: number, rowLimit: number) => Error;
