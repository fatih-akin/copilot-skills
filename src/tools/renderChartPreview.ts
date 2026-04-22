import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export interface RenderChartPreviewResult {
  htmlPath: string;
}

const buildHtml = (title: string, spec: Record<string, unknown>): string => {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      :root {
        color-scheme: light;
        font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
        background: linear-gradient(135deg, #f7f4ea 0%, #e4eef8 100%);
        color: #152033;
      }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 32px;
      }
      main {
        width: min(960px, 100%);
        background: rgba(255, 255, 255, 0.82);
        border: 1px solid rgba(21, 32, 51, 0.08);
        border-radius: 24px;
        box-shadow: 0 24px 80px rgba(31, 58, 94, 0.12);
        padding: 24px;
        backdrop-filter: blur(14px);
      }
      h1 {
        margin: 0 0 16px;
        font-size: clamp(1.6rem, 2vw, 2.4rem);
      }
      #vis {
        min-height: 420px;
      }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/vega@5"></script>
    <script src="https://cdn.jsdelivr.net/npm/vega-lite@5"></script>
    <script src="https://cdn.jsdelivr.net/npm/vega-embed@6"></script>
  </head>
  <body>
    <main>
      <h1>${title}</h1>
      <div id="vis"></div>
    </main>
    <script>
      const spec = ${JSON.stringify(spec, null, 2)};
      vegaEmbed('#vis', spec, { actions: true });
    </script>
  </body>
</html>`;
};

export const renderChartPreview = async (
  spec: Record<string, unknown>,
  title: string,
  outputDir: string,
  outputName: string
): Promise<RenderChartPreviewResult> => {
  await mkdir(outputDir, { recursive: true });
  const htmlPath = path.join(outputDir, `${outputName}.html`);
  await writeFile(htmlPath, buildHtml(title, spec), "utf8");
  return { htmlPath };
};