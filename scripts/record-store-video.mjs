import { chromium } from 'playwright';
import ffmpegPath from 'ffmpeg-static';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const outputDir = join(root, 'store-assets', 'video');
const tempDir = join(root, 'debug', 'recording-video');
const finalVideo = join(outputDir, 'arrow-shift-gameplay-1920x1080.mp4');
const previewFrame = join(outputDir, 'arrow-shift-gameplay-preview.png');
const port = 4181;
const url = `http://127.0.0.1:${port}/?recording=1`;

mkdirSync(outputDir, { recursive: true });
rmSync(tempDir, { recursive: true, force: true });
mkdirSync(tempDir, { recursive: true });

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' && command.endsWith('.cmd'), ...options });
  if (result.status !== 0) throw new Error(`${command} exited with ${result.status}`);
};

// Build the same production dist served by the preview server. The release ZIP is never touched.
run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build']);

const viteBin = join(root, 'node_modules', 'vite', 'bin', 'vite.js');
const serverArgs = ['preview', '--host', '127.0.0.1', '--port', String(port)];
const server = spawn(process.execPath, [viteBin, ...serverArgs], { cwd: root, stdio: 'ignore', windowsHide: true });

const sleep = (ms) => new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
let browserRef = null;
let contextRef = null;
const initialSave = JSON.stringify({
  saveVersion: 4,
  language: 'ru',
  soundOn: true,
  sfxOn: true,
  musicOn: true,
  highestUnlockedLevel: 30,
  lastPlayedLevel: 25,
  highestUnlockedRoute: 12,
  routeBestRotations: {},
  rushBestScore: 0,
  rushBestBoards: 0,
});

async function waitForServer(page) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 2500 });
      return;
    } catch {
      await sleep(150);
    }
  }
  throw new Error('Preview server did not become ready');
}

async function injectRecordingOverlay(page) {
  await page.evaluate(() => {
    const style = document.createElement('style');
    style.dataset.recordingStyle = 'true';
    style.textContent = `
      html.recording-mode, html.recording-mode * { cursor: none !important; }
      .recording-tap { position: fixed; z-index: 99999; width: 28px; height: 28px; margin: -14px 0 0 -14px; border: 2px solid #4b8873; border-radius: 50%; pointer-events: none; box-sizing: border-box; opacity: 0; transform: scale(.72); }
      .recording-tap::after { content: ""; position: absolute; inset: 5px; border: 1px solid rgb(75 136 115 / 55%); border-radius: 50%; }
      .recording-tap.is-visible { animation: recording-tap 210ms ease-out both; }
      @keyframes recording-tap { 0% { opacity: 0; transform: scale(.72); } 18% { opacity: .92; } 100% { opacity: 0; transform: scale(1.22); } }
    `;
    document.head.append(style);
    document.documentElement.classList.add('recording-mode');
    window.__recordTap = (x, y) => {
      const previous = document.querySelector('.recording-tap');
      previous?.remove();
      const tap = document.createElement('span');
      tap.className = 'recording-tap is-visible';
      tap.style.left = `${x}px`;
      tap.style.top = `${y}px`;
      document.body.append(tap);
      window.setTimeout(() => tap.remove(), 260);
    };
  });
}

async function tap(page, locator, settle = 240) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('Recording target is not visible');
  await page.evaluate(({ x, y }) => window.__recordTap?.(x, y), {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  });
  await sleep(55);
  await locator.click();
  await sleep(settle);
}

async function readBoard(page) {
  return page.evaluate(() => {
    const board = document.querySelector('.board');
    const arrows = [...document.querySelectorAll('button.arrow-tile')].map((button) => {
      const area = button.style.gridArea.match(/(\d+)\s*\/\s*(\d+)/);
      return {
        id: button.dataset.arrowId,
        row: Number(area?.[1] ?? 1) - 1,
        col: Number(area?.[2] ?? 1) - 1,
        direction: button.querySelector('[data-direction]')?.dataset.direction ?? 'right',
        pinned: button.classList.contains('is-pinned'),
      };
    });
    const barriers = [...document.querySelectorAll('.barrier-tile')].map((barrier) => {
      const area = barrier.style.gridArea.match(/(\d+)\s*\/\s*(\d+)/);
      return { row: Number(area?.[1] ?? 1) - 1, col: Number(area?.[2] ?? 1) - 1 };
    });
    return {
      rows: Number(board?.style.getPropertyValue('--rows') ?? 0),
      cols: Number(board?.style.getPropertyValue('--columns') ?? 0),
      arrows,
      barriers,
    };
  });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  browserRef = browser;
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: { dir: tempDir, size: { width: 1920, height: 1080 } },
  });
  contextRef = context;
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await waitForServer(page);
  await page.evaluate((save) => {
    localStorage.setItem('arrow-shift-save', save);
    location.reload();
  }, initialSave);
  await page.waitForSelector('.home-screen');
  await injectRecordingOverlay(page);
  await sleep(1850);

  // 0:00–0:03 — branded Home, then enter Puzzle.
  await tap(page, page.getByTestId('puzzle-mode-button'), 320);
  await tap(page, page.getByTestId('level-button-25'), 300);

  // 0:03–0:10 — real Puzzle Level 25 moves, including pinned arrows and barriers.
  const { LEVELS } = await import('../src/game/levels.js');
  const { applyMove, createFreshGameState, getAvailableMoves } = await import('../src/game/model.js');
  let puzzleState = createFreshGameState(LEVELS[24]);
  for (let index = 0; index < 4; index += 1) {
    const move = getAvailableMoves(puzzleState)[0];
    if (!move) break;
    await tap(page, page.locator(`[data-arrow-id="${move.id}"]`), 285);
    puzzleState = applyMove(puzzleState, move.id).state;
  }
  await sleep(760);

  // 0:10–0:17 — Route Level 8, real rotations, Run and signal arrival.
  const { solveRoute } = await import('../src/route/model.js');
  await tap(page, page.getByTestId('game-home-button'), 260);
  await tap(page, page.getByTestId('route-mode-button'), 260);
  await tap(page, page.getByTestId('route-level-button-8'), 260);
  const routeMoves = solveRoute((await import('../src/route/levels.js')).ROUTE_LEVELS[7]);
  for (const id of routeMoves.slice(0, 3)) await tap(page, page.locator(`[data-arrow-id="${id}"]`), 145);
  await tap(page, page.getByTestId('route-run-button'), 240);
  await sleep(1250);

  // 0:17–0:25 — Rush session with real clears and immediate next-board input.
  await tap(page, page.getByTestId('game-home-button'), 260);
  await tap(page, page.getByTestId('rush-mode-button'), 350);
  const rushStartedAt = Date.now();
  while (Date.now() - rushStartedAt < 6900) {
    let board = await readBoard(page);
    if (!board.arrows.length) { await sleep(260); continue; }
    const available = getAvailableMoves(board);
    if (!available.length) {
      const fallback = page.locator('button.arrow-tile').first();
      if (await fallback.count()) await tap(page, fallback, 220);
      continue;
    }
    const move = available[0];
    const target = page.locator(`[data-arrow-id="${move.id}"]`);
    if (!(await target.count())) { await sleep(220); continue; }
    await tap(page, target, 225);
  }
  await sleep(480);

  // 0:25–0:28 — return to Home for a clean closing frame.
  const homeButton = page.getByTestId('game-home-button');
  if (await homeButton.count()) await tap(page, homeButton, 250);
  await sleep(1900);

  await context.close();
  await browser.close();
  server.kill();

  if (consoleErrors.length) throw new Error(`Console errors during recording: ${consoleErrors.join(' | ')}`);
  const webm = join(tempDir, readdirSync(tempDir).find((name) => name.endsWith('.webm')) ?? '');
  if (!existsSync(webm)) throw new Error('Playwright did not produce a WebM recording');

  run(ffmpegPath, ['-y', '-i', webm, '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-r', '30', finalVideo]);
  run(ffmpegPath, ['-y', '-loglevel', 'error', '-ss', '18.0', '-i', finalVideo, '-frames:v', '1', '-vf', 'scale=960:540', previewFrame]);
  rmSync(tempDir, { recursive: true, force: true });
  console.log(`VIDEO=${finalVideo}`);
  console.log(`PREVIEW=${previewFrame}`);
  console.log('AUDIO=silent (Playwright video capture does not include Web Audio output)');
}

main().catch(async (error) => {
  try { await contextRef?.close(); } catch {}
  try { await browserRef?.close(); } catch {}
  try { server.kill(); } catch {}
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
