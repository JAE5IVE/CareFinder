import { describe, expect, it } from 'vitest';
import { SEEDED_HOSPITALS } from '../data/hospitals';
import { buildCsvContent, buildCsvFilename, DEFAULT_CSV_COLUMNS, escapeCsvCell, sanitizeFilenamePart } from './csv';

describe('CSV export utilities', () => {
  it('sanitizes search text for traceable filenames', () => {
    expect(sanitizeFilenamePart('Lagos maternity + dental')).toBe('lagos-maternity-dental');
  });

  it('falls back to all-nigeria for empty search text', () => {
    expect(sanitizeFilenamePart('   ')).toBe('all-nigeria');
  });

  it('builds filenames with the selected date', () => {
    expect(buildCsvFilename('Lagos', new Date('2026-05-28T12:00:00.000Z'))).toBe('hospitals-lagos-2026-05-28.csv');
  });

  it('escapes CSV quotes and array values', () => {
    expect(escapeCsvCell('A "quoted" name')).toBe('"A ""quoted"" name"');
    expect(escapeCsvCell(['Emergency', 'Maternity'])).toBe('"Emergency; Maternity"');
  });

  it('exports only enabled columns', () => {
    const columns = DEFAULT_CSV_COLUMNS.map((column) => ({ ...column, enabled: column.key === 'name' }));
    const csv = buildCsvContent(SEEDED_HOSPITALS.slice(0, 1), columns);
    expect(csv.split(/\r?\n/)[0]).toBe('"Hospital Name"');
    expect(csv).toContain('Lagos University Teaching Hospital');
    expect(csv).not.toContain('Full Address');
  });
});
