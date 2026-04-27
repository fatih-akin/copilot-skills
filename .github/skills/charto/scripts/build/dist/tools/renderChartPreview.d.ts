export interface RenderChartPreviewResult {
    htmlPath: string;
    pngPath?: string;
    pngBase64?: string;
    pngSkipped?: boolean;
}
export interface RenderChartPreviewOptions {
    includePngBase64?: boolean;
}
export declare const renderChartPreview: (spec: Record<string, unknown>, title: string, outputDir: string, outputName: string, options?: RenderChartPreviewOptions) => Promise<RenderChartPreviewResult>;
