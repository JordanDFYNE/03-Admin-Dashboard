import { parse } from 'csv-parse/sync';

export function parseCsvBuffer(buffer) {
  return parse(buffer, {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });
}
