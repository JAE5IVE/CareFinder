import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Papa from 'papaparse';
import { createClient } from '@supabase/supabase-js';

const HOSPITAL_CATEGORIES = new Set([
  'General Hospital',
  'Cottage Hospital',
  'Federal Medical Center',
  'District Hospital',
  'Specialist Hospital',
  'Teaching Hospital',
  'Research Hospital',
  'Medical Center',
]);

const SOURCE_NAME = 'HDX Nigeria Health Facilities';
const PUBLIC_CATEGORIES = new Set([
  'General Hospital',
  'Cottage Hospital',
  'Federal Medical Center',
  'District Hospital',
  'Teaching Hospital',
]);
const DEFAULT_CSV = path.join(os.tmpdir(), 'carefinder-nigeria-health-facilities.csv');
const DEFAULT_SHP = path.join(
  os.tmpdir(),
  'carefinder-nigeria-health-facilities-shp',
  'NigeriaHealthFacilities.shp',
);

function loadEnv(filePath) {
  const values = {};
  if (!fs.existsSync(filePath)) return values;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([^#=]+)=(.*)$/);
    if (match) values[match[1].trim()] = match[2].trim();
  }
  return values;
}

function readPointShapefile(filePath) {
  const buffer = fs.readFileSync(filePath);
  const coordinates = [];
  let offset = 100;

  while (offset + 8 <= buffer.length) {
    const contentBytes = buffer.readInt32BE(offset + 4) * 2;
    const shapeOffset = offset + 8;
    const shapeType = buffer.readInt32LE(shapeOffset);
    coordinates.push(
      shapeType === 1
        ? {
            longitude: buffer.readDoubleLE(shapeOffset + 4),
            latitude: buffer.readDoubleLE(shapeOffset + 12),
          }
        : null,
    );
    offset += 8 + contentBytes;
  }

  return coordinates;
}

function normalizeText(value, fallback = '') {
  const text = String(value ?? '').trim().replace(/\s+/g, ' ');
  return text || fallback;
}

function classifyOwnership(row) {
  const text = `${row.name || ''} ${row.alternate_name || ''}`.toLowerCase();
  const publicSignal = /\b(federal|government|state hospital|general hospital|district hospital|teaching hospital|university hospital|national hospital|military)\b/;
  const privateSignal = /\b(private|specialist|medical cent(?:er|re)|memorial|catholic|baptist|mission|foundation)\b/;

  if (publicSignal.test(text)) return 'public';
  if (privateSignal.test(text)) return 'private';
  return PUBLIC_CATEGORIES.has(row.category) ? 'public' : 'private';
}

function buildRecords(csvPath, shpPath) {
  const parsed = Papa.parse(fs.readFileSync(csvPath, 'utf8'), {
    header: true,
    skipEmptyLines: true,
  });
  if (parsed.errors.length) {
    throw new Error(`CSV parsing failed: ${parsed.errors[0].message}`);
  }

  const coordinates = readPointShapefile(shpPath);
  if (coordinates.length !== parsed.data.length) {
    throw new Error(`Coordinate count ${coordinates.length} does not match CSV row count ${parsed.data.length}.`);
  }

  const records = [];
  const seenSourceIds = new Set();
  for (let index = 0; index < parsed.data.length; index += 1) {
    const row = parsed.data[index];
    const coordinate = coordinates[index];
    if (!HOSPITAL_CATEGORIES.has(row.category)) continue;
    if (row.functional_status === 'Not Functional') continue;
    if (!coordinate || !Number.isFinite(coordinate.latitude) || !Number.isFinite(coordinate.longitude)) continue;
    if (seenSourceIds.has(row.global_id)) continue;
    seenSourceIds.add(row.global_id);

    const name = normalizeText(row.name, 'Unnamed health facility');
    const lga = normalizeText(row.lga_name, 'Unknown LGA');
    const state = normalizeText(row.state_name, 'Unknown state');
    const category = normalizeText(row.category, 'Hospital');
    const careLevel = normalizeText(row.type, 'Unknown');
    const functionalStatus = normalizeText(row.functional_status, 'Unknown');
    const ownership = classifyOwnership(row);

    records.push({
      id: row.global_id,
      name,
      address: `${name}, ${lga}, ${state}`,
      city: lga,
      lga,
      state,
      phone: 'Not listed',
      email: null,
      ownership,
      specialties: [category],
      visiting_hours_markdown: 'Visiting hours are not listed in the registry source.',
      description_markdown: `${category} listed as a ${careLevel.toLowerCase()}-level facility.`,
      notes_markdown: `Registry status: ${functionalStatus}. Imported from the HDX Nigeria Health Facilities dataset. Ownership was grouped using facility name and category signals because the source does not provide a dedicated ownership field. Contact details, services, ownership, and current operating status should be independently verified.`,
      location: `SRID=4326;POINT(${coordinate.longitude} ${coordinate.latitude})`,
      photo_urls: [],
      status: 'approved',
      source_name: SOURCE_NAME,
      source_id: row.global_id,
      source_updated_at: row.timestamp || null,
      facility_category: category,
      care_level: careLevel,
      functional_status: functionalStatus,
    });
  }

  return records;
}

async function importRecords(records, env) {
  if (!env.VITE_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for --commit.');
  }

  const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const batchSize = 200;
  for (let offset = 0; offset < records.length; offset += batchSize) {
    const batch = records.slice(offset, offset + batchSize);
    const { error } = await supabase.from('hospitals').upsert(batch, { onConflict: 'id' });
    if (error) throw error;
    console.log(`Imported ${Math.min(offset + batch.length, records.length)} of ${records.length}`);
  }
}

const rawArgs = process.argv.slice(2);
const args = new Set(rawArgs);
const limitArg = rawArgs.find((arg) => arg.startsWith('--limit='));
const requestedLimit = limitArg ? Number.parseInt(limitArg.split('=')[1], 10) : null;
const env = { ...process.env, ...loadEnv(path.resolve('.env.local')) };
const csvPath = env.NIGERIA_FACILITIES_CSV || DEFAULT_CSV;
const shpPath = env.NIGERIA_FACILITIES_SHP || DEFAULT_SHP;
const allRecords = buildRecords(csvPath, shpPath);
const records = requestedLimit && requestedLimit > 0 ? allRecords.slice(0, requestedLimit) : allRecords;
const states = new Set(records.map((record) => record.state));
const ownershipCounts = records.reduce(
  (counts, record) => ({ ...counts, [record.ownership]: counts[record.ownership] + 1 }),
  { public: 0, private: 0 },
);

console.log(JSON.stringify({
  mode: args.has('--commit') ? 'commit' : 'dry-run',
  source: SOURCE_NAME,
  records: records.length,
  availableRecords: allRecords.length,
  states: states.size,
  ownership: ownershipCounts,
  csvPath,
  shpPath,
}, null, 2));

if (args.has('--commit')) {
  await importRecords(records, env);
  console.log(`Nationwide import complete: ${records.length} hospital-like facilities.`);
}
