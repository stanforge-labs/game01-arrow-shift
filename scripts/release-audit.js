import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { createZipArchive, readZipEntryNames, toZipPath, zipEntryIssues } from './zip-utils.js';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist-yandex');
const release = resolve(root, 'release');
const releaseVersion = process.env.RELEASE_VERSION || '1.0.4';
const zip = resolve(release, `arrow-shift-yandex-${releaseVersion}.zip`);
const auditPath = resolve(release, `audit-${releaseVersion}.txt`);
const readmePath = resolve(release, `README-${releaseVersion}.md`);
const forceRebuild = process.env.RELEASE_FORCE === '1';
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
if (forceRebuild && existsSync(zip)) unlinkSync(zip);
if (!existsSync(zip)) {
  createZipArchive(dist, zip);
  if (!existsSync(zip)) fail('could not create release ZIP');
} else {
  console.log('Using existing release ZIP (production source is unchanged)');
}

const files = walk(dist);
const relativeNames = files.map((file) => toZipPath(relative(dist, file)));
const invalidNames = relativeNames.filter((name) => name.split(/[\\/]/).some((part) => invalidNamePattern.test(part)));
const sourceMaps = relativeNames.filter((name) => name.toLowerCase().endsWith('.map'));
const bundleText = files.filter((file) => /\.js$/.test(file)).map((file) => readFileSync(file, 'utf8')).join('\n');
const devMarkers = forbiddenProductionMarkers.filter((marker) => bundleText.includes(marker));
const indexText = readFileSync(join(dist, 'index.html'), 'utf8');
const sdkScriptMatches = indexText.match(/<script\s+src=["']\/sdk\.js["']><\/script>/g) || [];
const moduleScriptIndex = indexText.indexOf('type="module"');
const sdkScriptIndex = indexText.indexOf('/sdk.js');
const dynamicSdkLoader = /createElement\(["']script["']\)|\.src\s*=\s*["']\/sdk\.js["']/.test(bundleText);
const hasRootIndex = relativeNames.includes('index.html');
const unpackedBytes = bytes(files);
const zipBytes = existsSync(zip) ? statSync(zip).size : 0;
const hash = existsSync(zip) ? sha256(zip) : 'n/a';
const zipEntries = existsSync(zip) ? readZipEntryNames(zip) : [];
const backslashEntries = zipEntries.filter((name) => name.includes('\\'));
const unsafeZipEntries = zipEntries.filter((name) => zipEntryIssues(name).length > 0);
const hasAssetsDirectory = zipEntries.some((name) => name.startsWith('assets/'));
const referencedLocalAssets = [...indexText.matchAll(/\b(?:src|href)=["']([^"']+)["']/gi)]
  .map((match) => match[1].split(/[?#]/)[0])
  .filter((name) => name.startsWith('./') || (!name.startsWith('/') && !name.includes(':')))
  .map((name) => name.replace(/^\.\//, ''));
const missingReferencedAssets = referencedLocalAssets.filter((name) => !zipEntries.includes(name));

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
  ['PASS Yandex SDK /sdk.js loader', sdkScriptMatches.length === 1 && sdkScriptIndex >= 0 && sdkScriptIndex < moduleScriptIndex],
  ['PASS no duplicate dynamic SDK loader', !dynamicSdkLoader],
  ['PASS ZIP entry separators', backslashEntries.length === 0 && unsafeZipEntries.length === 0],
  ['PASS ZIP assets directory', hasAssetsDirectory],
  ['PASS ZIP referenced assets', missingReferencedAssets.length === 0],
  ['PASS production build', files.length > 0],
];
const report = [
  `Arrow Shift ${releaseVersion}`,
  ...checks.map(([label, ok]) => `${ok ? label : label.replace('PASS', 'FAIL')}`),
  `File count: ${files.length}`,
  `Unpacked size: ${formatBytes(unpackedBytes)}`,
  `Archive size: ${formatBytes(zipBytes)}`,
  `SHA256: ${hash}`,
  `ZIP entries: ${zipEntries.join(', ')}`,
  `Backslash entries: ${backslashEntries.length}`,
  `Missing referenced assets: ${missingReferencedAssets.length}`,
  ...(invalidNames.length ? [`Invalid filenames: ${invalidNames.join(', ')}`] : []),
  ...(devMarkers.length ? [`Development markers: ${devMarkers.join(', ')}`] : []),
  '',
].join('\n');
writeFileSync(auditPath, report, 'utf8');
console.log(report);
if (unpackedBytes >= maxUnpackedBytes || invalidNames.length || sourceMaps.length || devMarkers.length || !hasRootIndex || !existsSync(zip) || /src="\/(assets|favicon)/.test(indexText) || sdkScriptMatches.length !== 1 || sdkScriptIndex < 0 || sdkScriptIndex > moduleScriptIndex || dynamicSdkLoader || backslashEntries.length || unsafeZipEntries.length || !hasAssetsDirectory || missingReferencedAssets.length) process.exitCode = 1;
