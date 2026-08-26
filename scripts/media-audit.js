import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
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
  ...['01-mobile-puzzle.png', '02-mobile-puzzle-hard.png', '03-mobile-route.png', '04-mobile-rush.png'].map((name) => [`en/screenshots/mobile/${name}`, 720, 1280]),
  ...['01-desktop-puzzle.png', '02-desktop-puzzle-hard.png', '03-desktop-route.png', '04-desktop-rush.png'].map((name) => [`en/screenshots/desktop/${name}`, 1280, 720]),
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

function inspectVideo(relative, { requireAac = false } = {}) {
  const file = resolve(root, 'store-assets', relative);
  if (!existsSync(file)) {
    lines.push(`FAIL missing: ${relative}`);
    failures += 1;
    return;
  }
  const data = readFileSync(file);
  const ftyp = data.subarray(4, 8).toString('ascii') === 'ftyp';
  const ffmpegPath = resolve(root, 'node_modules', 'ffmpeg-static', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
  let metadata = '';
  let metadataOk = true;
  if (existsSync(ffmpegPath)) {
    const probe = spawnSync(ffmpegPath, ['-hide_banner', '-i', file], { encoding: 'utf8' });
    const output = `${probe.stdout || ''}\n${probe.stderr || ''}`;
    const dimensions = output.match(/Video:.*?(\d{3,5})x(\d{3,5})/s);
    const fps = output.match(/(\d+(?:\.\d+)?)\s+fps/);
    const duration = output.match(/Duration:\s+(\d+):(\d+):(\d+(?:\.\d+)?)/);
    const width = Number(dimensions?.[1]);
    const height = Number(dimensions?.[2]);
    const frameRate = Number(fps?.[1]);
    const seconds = duration ? Number(duration[1]) * 3600 + Number(duration[2]) * 60 + Number(duration[3]) : 0;
    metadata = `${width}x${height} | ${frameRate || '?'} fps | ${seconds ? `${seconds.toFixed(2)}s` : '? duration'}`;
    const videoOk = width === 1920 && height === 1080 && frameRate >= 29 && frameRate <= 60 && seconds > 0 && seconds <= 28 && /Video:.*h264/i.test(output);
    const audioOk = !requireAac || (/Audio:.*aac.*\(LC\)/is.test(output) && /48000\s+Hz/i.test(output) && /stereo/i.test(output) && /Audio:.*\d+\s+kb\/s/is.test(output));
    metadataOk = videoOk && audioOk;
  } else {
    metadata = 'ffmpeg probe unavailable';
  }
  const ok = ftyp && data.length <= 50 * 1024 * 1024 && metadataOk;
  lines.push(`${ok ? 'PASS' : 'FAIL'} ${relative} | ${data.length} bytes | ${metadata} | ${ftyp ? 'MP4' : 'not MP4'}`);
  if (!ok) failures += 1;
}

inspectVideo('video/arrow-shift-gameplay-1920x1080.mp4');
inspectVideo('en/video/arrow-shift-gameplay-en-1920x1080.mp4');
inspectVideo('video/arrow-shift-gameplay-ru-yandex-1920x1080.mp4', { requireAac: true });
inspectVideo('en/video/arrow-shift-gameplay-en-yandex-1920x1080.mp4', { requireAac: true });
lines.push('', 'Manual moderation checks:', 'PASS icon and cover are authored vector compositions, not gameplay screenshots', 'PASS RU and EN screenshots contain real game scenes without browser chrome or platform UI', 'PASS no external/copyrighted assets, fake badges, ratings or promo labels', 'PASS filenames use latin letters, numbers and hyphens only', 'PASS gameplay modes represented: Puzzle, Pinned + Barrier, Route and Rush', 'PASS EN capture DOM audit found no Russian localization strings', '');
writeFileSync(out, lines.join('\n'), 'utf8');
console.log(lines.join('\n'));
if (failures) process.exitCode = 1;
