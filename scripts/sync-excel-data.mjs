import { readFile, rm, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import XLSX from 'xlsx';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workbookPath = resolve(root, 'DATABASE_SERVER.xlsx');
const required = {
  CATEGORIES: ['ID','TITLE','DESCRIPTION','PICTURE LINK','GROUP','PICTURE SIZE'],
  ACCESS: ['CATEGORIES','ID','TITLE','TYPE','POSTER/PICTURE LINK','YEAR/STATUS'],
  DATABASE: ['CATEGORIES','ID','TITLE','TYPE','SEASON','EPISODE','VIDEO LINK'],
  LIST: ['ID','TITLE','DESCRIPTION','PICTURE LINK','GROUP','PICTURE SIZE'],
  BUY: ['ID','TITLE','DESCRIPTION','PICTURE LINK','GROUP','DESCRIPTION','BUY BUTTON LINK'],
  TRIAL: ['ID','TITLE','DESCRIPTION','PICTURE LINK','VIDEO LINK','OTHER DESCRIPTION','BUY BUTTON LINK'],
  PIN: ['CATEGORIES','PIN']
};
const outputFiles = { CATEGORIES:'categories.json', ACCESS:'access.json', LIST:'list.json', BUY:'buy.json', TRIAL:'trial.json', PIN:'pin.json' };
const workbook = XLSX.read(await readFile(workbookPath), { type: 'buffer', raw: false });

function readSheet(name) {
  const sheet = workbook.Sheets[name];
  if (!sheet) throw new Error(`Missing required sheet: ${name}`);
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
  const headers = (rows[0] || []).slice(0, required[name].length).map(v => String(v).trim());
  if (JSON.stringify(headers) !== JSON.stringify(required[name])) {
    throw new Error(`${name} headers changed. Expected: ${required[name].join(' | ')}`);
  }
  return rows.slice(1)
    .map(row => row.slice(0, required[name].length).map(value => value == null ? '' : value))
    .filter(row => row.some(value => String(value).trim() !== ''));
}

const data = Object.fromEntries(Object.keys(required).map(name => [name, readSheet(name)]));
for (const row of data.PIN) row[1] = String(row[1] ?? '').replace(/^'/, '').padStart(4, '0');
const accessIds = new Set();
const warnings = [];
for (const [index, row] of data.ACCESS.entries()) {
  const id = String(row[1] ?? '').trim();
  if (!id) throw new Error(`ACCESS row ${index + 2}: ID is empty.`);
  if (accessIds.has(id)) warnings.push(`ACCESS row ${index + 2}: duplicate title ID ${id}.`);
  accessIds.add(id);
}
for (const [index, row] of data.DATABASE.entries()) {
  const id = String(row[1] ?? '').trim();
  if (!id) throw new Error(`DATABASE row ${index + 2}: ID is empty.`);
  if (!accessIds.has(id)) warnings.push(`DATABASE row ${index + 2}: ID ${id} does not exist in ACCESS.`);
}
for (const [index, row] of data.PIN.entries()) {
  if (!/^\d{4}$/.test(String(row[1]))) throw new Error(`PIN row ${index + 2}: PIN must contain exactly 4 digits.`);
}

const sheetsDir = resolve(root, 'data/sheets');
await mkdir(sheetsDir, { recursive: true });
for (const [name, file] of Object.entries(outputFiles)) {
  await writeFile(resolve(sheetsDir, file), `${JSON.stringify({ sheet: name, range: `A:${String.fromCharCode(64 + required[name].length)}`, values: data[name] }, null, 2)}\n`);
}

const shardCount = 64;
const dbDir = resolve(root, 'data/database');
const shardDir = resolve(dbDir, 'shards');
await rm(shardDir, { recursive: true, force: true });
await mkdir(shardDir, { recursive: true });
const rowsById = new Map();
for (const row of data.DATABASE) {
  const id = String(row[1]).trim();
  if (!rowsById.has(id)) rowsById.set(id, []);
  rowsById.get(id).push(row);
}
const shards = Array.from({ length: shardCount }, () => []);
const files = {};
for (const id of [...rowsById.keys()].sort((a,b) => a.localeCompare(b))) {
  const number = createHash('sha256').update(id).digest().readUInt32BE(0) % shardCount;
  const file = `shard-${String(number).padStart(2,'0')}.json`;
  files[id] = `shards/${file}`;
  shards[number].push(...rowsById.get(id));
}
for (let i = 0; i < shardCount; i++) {
  await writeFile(resolve(shardDir, `shard-${String(i).padStart(2,'0')}.json`), `${JSON.stringify({ sheet:'DATABASE', shard:i, shardCount, values:shards[i] }, null, 2)}\n`);
}
await writeFile(resolve(dbDir, 'index.json'), `${JSON.stringify({ sheet:'DATABASE', range:'A:G', titleCount:rowsById.size, rowCount:data.DATABASE.length, shardCount, files }, null, 2)}\n`);
console.log(`Excel validation passed: ${data.ACCESS.length} titles, ${data.DATABASE.length} database rows, ${data.PIN.length} PIN rows.`);
for (const warning of warnings) console.warn(`Warning: ${warning}`);
