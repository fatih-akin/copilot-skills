import { loadTabularFile } from '../dist/tools/loadTabularFile.js';
import { inferSchema } from '../dist/tools/inferSchema.js';
import { generateVegaSpec } from '../dist/tools/generateVegaSpec.js';
import { renderChartPreview } from '../dist/tools/renderChartPreview.js';

const loaded = await loadTabularFile('./examples/plans.csv', { rowLimit: 2000 });

// Transform: group by planned_start_date, count records
const grouped = {};
for (const row of loaded.rows) {
  const key = row['planned_start_date'];
  if (!key) continue;
  grouped[key] = (grouped[key] || 0) + 1;
}
const rows = Object.entries(grouped)
  .map(([planned_start_date, record_count]) => ({ planned_start_date, record_count }))
  .sort((a, b) => a.planned_start_date.localeCompare(b.planned_start_date));

const schema = inferSchema(rows);
const generated = generateVegaSpec({ rows, schema, intent: 'daily plan count trend over planned_start_date', rowLimit: 2000 });
const rendered = await renderChartPreview(generated.spec, 'Daily Plan Count by Start Date', './artifacts', 'plans-daily-count-line');

console.log(JSON.stringify({ largeDatasetMode: generated.largeDatasetMode, recommendation: generated.recommendation, artifact: rendered }, null, 2));
