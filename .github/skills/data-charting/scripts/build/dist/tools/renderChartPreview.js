import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import * as vega from "vega";
import * as vegaLite from "vega-lite";
const buildHtml = (title, spec) => {
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
        color: #152033;
      }
      body {
        margin: 0;
        min-height: 100vh;
        background: #f0f4f8;
        padding: 32px;
        box-sizing: border-box;
      }
      main {
        display: inline-block;
        min-width: max-content;
        background: #ffffff;
        border: 1px solid rgba(21, 32, 51, 0.08);
        border-radius: 24px;
        box-shadow: 0 24px 80px rgba(31, 58, 94, 0.12);
        padding: 24px;
      }
      h1 {
        margin: 0 0 16px;
        font-size: clamp(1.6rem, 2vw, 2.4rem);
      }
      #vis {
        min-height: 420px;
      }
      #vis-error {
        color: #c0392b;
        font-family: monospace;
        padding: 12px;
        background: #fdecea;
        border-radius: 8px;
        display: none;
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
      <pre id="vis-error"></pre>
    </main>
    <script>
      const spec = ${JSON.stringify(spec, null, 2)};
      vegaEmbed('#vis', spec, { actions: true }).catch(function(err) {
        var el = document.getElementById('vis-error');
        el.style.display = 'block';
        el.textContent = 'Chart render error: ' + err.message;
      });
    </script>
  </body>
</html>`;
};
const PNG_MAX_WIDTH = 3000;
/** For step-based widths, cap the PNG render width to avoid huge/blank canvases. */
const capSpecWidth = (spec) => {
    const width = spec.width;
    if (width !== null && typeof width === "object" && "step" in width) {
        return { ...spec, width: PNG_MAX_WIDTH };
    }
    return spec;
};
const renderToPng = async (spec) => {
    const capped = capSpecWidth(spec);
    const vegaSpec = vegaLite.compile(capped).spec;
    const view = new vega.View(vega.parse(vegaSpec), { renderer: "none" });
    await view.runAsync();
    const canvas = await view.toCanvas(1);
    return canvas.toBuffer("image/png");
};
export const renderChartPreview = async (spec, title, outputDir, outputName, options = {}) => {
    await mkdir(outputDir, { recursive: true });
    const htmlPath = path.join(outputDir, `${outputName}.html`);
    await writeFile(htmlPath, buildHtml(title, spec), "utf8");
    const pngBuffer = await renderToPng(spec);
    const pngPath = path.join(outputDir, `${outputName}.png`);
    await writeFile(pngPath, pngBuffer);
    const includePngBase64 = options.includePngBase64 ?? true;
    if (!includePngBase64) {
        return { htmlPath, pngPath };
    }
    const pngBase64 = `data:image/png;base64,${pngBuffer.toString("base64")}`;
    return { htmlPath, pngPath, pngBase64 };
};
