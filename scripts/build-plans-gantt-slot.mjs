import { loadTabularFile } from '../dist/tools/loadTabularFile.js';
import { renderChartPreview } from '../dist/tools/renderChartPreview.js';

const loaded = await loadTabularFile('./examples/plans.csv', { rowLimit: 6000 });

// Use all rows that have the required fields
const rows = loaded.rows
  .filter(r => r['slot_id'] != null && r['planned_start_date'] && r['planned_end_date'])
  .map(r => ({
    slot_id: String(r['slot_id']),
    planned_start_date: r['planned_start_date'],
    planned_end_date: r['planned_end_date'],
  }));

// Build Vega-Lite Gantt spec directly
const spec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  title: 'Gantt: Slot ID by Planned Start → End Date',
  description: 'Gantt chart showing maintenance plan durations per slot.',
  data: { values: rows },
  width: 900,
  height: 600,
  mark: 'bar',
  encoding: {
    x: { field: 'planned_start_date', type: 'temporal', title: 'Planned Start Date' },
    x2: { field: 'planned_end_date' },
    y: {
      field: 'slot_id',
      type: 'nominal',
      sort: { field: 'planned_start_date', order: 'ascending' },
      title: 'Slot ID',
    },
    tooltip: [
      { field: 'slot_id', type: 'nominal', title: 'Slot ID' },
      { field: 'planned_start_date', type: 'temporal', title: 'Start' },
      { field: 'planned_end_date', type: 'temporal', title: 'End' },
    ],
  },
};

const rendered = await renderChartPreview(
  spec,
  'Gantt: Slot ID by Planned Start → End Date',
  './artifacts',
  'plans-gantt-slot-timeline',
  { includePngBase64: false }
);

console.log(JSON.stringify({
  artifact: { htmlPath: rendered.htmlPath, pngPath: rendered.pngPath },
}, null, 2));

