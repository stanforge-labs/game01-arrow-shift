import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist-yandex');
const release = resolve(root, 'release');
const zip = resolve(release, 'arrow-shift-yandex-1.0.0.zip');
const auditPath = resolve(release, 'audit.txt');
const readmePath = resolve(release, 'README.md');
const maxUnpackedBytes = 100 * 1024 * 1024;
const invalidNamePattern = /[\u0000-\u001f\u007f-\u009f\s\u0080-\uffff]/;
const forbiddenProductionMarkers = ['arrow-shift-mock', 'mockAd', 'platform=mock', 'rushResult', 'screen=boot'];

function walk(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}

function bytes(files) { return files.reduce((total, file) => total + statSync(file).size, 0); }
function formatBytes(value) { return `${value} bytes (${(value / 1024).toFixed(1)} KiB)`; }
function sha256(file) { return createHash('sha256').update(readFileSync(file)).digest('hex'); }
function fail(message) { console.error(`release:audit: ${message}`); process.exitCode = 1; }

if (!existsSync(join(dist, 'index.html'))) {
  fail('dist-yandex/index.html is missing; run npm run build:yandex first');
  process.exit();
}

mkdirSync(release, { recursive: true });
if (existsSync(zip)) unlinkSync(zip);
const ps = `Add-Type -AssemblyName System.IO.Compression.FileSystem; [IO.Compression.ZipFile]::CreateFromDirectory('${dist.replaceAll("'", "''")}', '${zip.replaceAll("'", "''")}', [IO.Compression.CompressionLevel]::Optimal, $false)`;
const archive = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], { stdio: 'inherit' });
if (archive.status !== 0 || !existsSync(zip)) fail('could not create release ZIP');

const files = walk(dist);
const relativeNames = files.map((file) => relative(dist, file));
const invalidNames = relativeNames.filter((name) => name.split(/[\\/]/).some((part) => invalidNamePattern.test(part)));
const sourceMaps = relativeNames.filter((name) => name.toLowerCase().endsWith('.map'));
const bundleText = files.filter((file) => /\.js$/.test(file)).map((file) => readFileSync(file, 'utf8')).join('\n');
const devMarkers = forbiddenProductionMarkers.filter((marker) => bundleText.includes(marker));
const indexText = readFileSync(join(dist, 'index.html'), 'utf8');
const hasRootIndex = relativeNames.includes('index.html');
const unpackedBytes = bytes(files);
const zipBytes = existsSync(zip) ? statSync(zip).size : 0;
const hash = existsSync(zip) ? sha256(zip) : 'n/a';

if (existsSync(readmePath) && hash !== 'n/a') {
  const readme = readFileSync(readmePath, 'utf8').replace(/SHA-256:.*/i, `SHA-256: \`${hash}\``);
  writeFileSync(readmePath, readme, 'utf8');
}

const checks = [
  ['PASS index.html root', hasRootIndex],
  ['PASS unpacked size', unpackedBytes < maxUnpackedBytes],
  ['PASS filename audit', invalidNames.length === 0],
  ['PASS no source maps', sourceMaps.length === 0],
  ['PASS no dev mocks', devMarkers.length === 0],
  ['PASS relative runtime assets', !/src="\/(assets|favicon)/.test(indexText)],
  ['PASS production build', files.length > 0],
];
const report = [
  'Arrow Shift 1.0.0',
  ...checks.map(([label, ok]) => `${ok ? label : label.replace('PASS', 'FAIL')}`),
  `File count: ${files.length}`,
  `Unpacked size: ${formatBytes(unpackedBytes)}`,
  `Archive size: ${formatBytes(zipBytes)}`,
  `SHA256: ${hash}`,
  ...(invalidNames.length ? [`Invalid filenames: ${invalidNames.join(', ')}`] : []),
  ...(devMarkers.length ? [`Development markers: ${devMarkers.join(', ')}`] : []),
  '',
].join('\n');
writeFileSync(auditPath, report, 'utf8');
console.log(report);
if (unpackedBytes >= maxUnpackedBytes || invalidNames.length || sourceMaps.length || devMarkers.length || !hasRootIndex || !existsSync(zip) || /src="\/(assets|favicon)/.test(indexText)) process.exitCode = 1;
