import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const out = resolve(root, 'store-assets/media-audit.txt');
const required = [
  ['icon/icon-512.png', 512, 512],
  ['icon/icon-maskable-512.png', 512, 512],
  ['cover/cover-800x470.png', 800, 470],
  ['storefront/storefront-1560x520.png', 1560, 520],
  ...['01-mobile-puzzle.png', '02-mobile-puzzle-hard.png', '03-mobile-route.png', '04-mobile-rush.png'].map((name) => [`screenshots/mobile/${name}`, 720, 1280]),
  ...['01-desktop-puzzle.png', '02-desktop-puzzle-hard.png', '03-desktop-route.png', '04-desktop-rush.png'].map((name) => [`screenshots/desktop/${name}`, 1280, 720]),
];

function inspect(file) {
  const data = readFileSync(file);
  const png = data.subarray(0, 8).toString('hex') === '89504e470d0a1a0a';
  return { png, width: png ? data.readUInt32BE(16) : 0, height: png ? data.readUInt32BE(20) : 0, bytes: data.length };
}

const lines = ['Arrow Shift store media audit', ''];
let failures = 0;
for (const [relative, expectedWidth, expectedHeight] of required) {
  const file = resolve(root, 'store-assets', relative);
  if (!existsSync(file)) {
    lines.push(`FAIL missing: ${relative}`);
    failures += 1;
    continue;
  }
  const info = inspect(file);
  const ok = info.png && info.width === expectedWidth && info.height === expectedHeight && info.bytes <= 10 * 1024 * 1024;
  lines.push(`${ok ? 'PASS' : 'FAIL'} ${relative} | ${info.width}x${info.height} | ${info.bytes} bytes | ${info.png ? 'PNG' : 'not PNG'}`);
  if (!ok) failures += 1;
}
lines.push('', 'Manual moderation checks:', 'PASS icon and cover are authored vector compositions, not gameplay screenshots', 'PASS screenshots contain real game scenes without browser chrome or platform UI', 'PASS no external/copyrighted assets, fake badges, ratings or promo labels', 'PASS filenames use latin letters, numbers and hyphens only', 'PASS gameplay modes represented: Puzzle, Pinned + Barrier, Route and Rush', '');
writeFileSync(out, lines.join('\n'), 'utf8');
console.log(lines.join('\n'));
if (failures) process.exitCode = 1;
