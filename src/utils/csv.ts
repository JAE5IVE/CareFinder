import { Hospital } from '../types';
import Papa from 'papaparse';

export interface CsvColumn {
  key: keyof Hospital;
  label: string;
  enabled: boolean;
}

export const DEFAULT_CSV_COLUMNS: CsvColumn[] = [
  { key: 'name', label: 'Hospital Name', enabled: true },
  { key: 'address', label: 'Full Address', enabled: true },
  { key: 'city', label: 'City', enabled: true },
  { key: 'lga', label: 'Local Government Area (LGA)', enabled: true },
  { key: 'state', label: 'State', enabled: true },
  { key: 'phone', label: 'Phone Number', enabled: true },
  { key: 'email', label: 'Email Address', enabled: true },
  { key: 'specialties', label: 'Medical Specialties', enabled: true },
  { key: 'ownership', label: 'Ownership (Public/Private)', enabled: true },
  { key: 'rating', label: 'Average Customer Rating', enabled: true },
];

export function sanitizeFilenamePart(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return normalized || 'all-nigeria';
}

export function buildCsvFilename(searchQuery: string, date = new Date()): string {
  return `hospitals-${sanitizeFilenamePart(searchQuery)}-${date.toISOString().slice(0, 10)}.csv`;
}

export function escapeCsvCell(value: unknown): string {
  const text = Array.isArray(value) ? value.join('; ') : String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

export function buildCsvContent(hospitals: Hospital[], columns: CsvColumn[]): string {
  const activeColumns = columns.filter((column) => column.enabled);
  const rows = hospitals.map((hospital) => {
    return activeColumns.reduce<Record<string, string>>((row, column) => {
      const value = hospital[column.key];
      row[column.label] = Array.isArray(value) ? value.join('; ') : String(value ?? '');
      return row;
    }, {});
  });
  return Papa.unparse(rows, {
    columns: activeColumns.map((column) => column.label),
    quotes: true,
  });
}
