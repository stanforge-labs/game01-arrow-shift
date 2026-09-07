import { chromium } from 'playwright';
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const mediaRoot = join(root, 'store-assets', 'en');
const mobileDir = join(mediaRoot, 'screenshots', 'mobile');
const desktopDir = join(mediaRoot, 'screenshots', 'desktop');
const port = 4182;
const url = `http://127.0.0.1:${port}/`;
const tempSave = JSON.stringify({
  saveVersion: 4,
  language: 'en',
  soundOn: false,
  sfxOn: false,
  musicOn: false,
  highestUnlockedLevel: 30,
  lastPlayedLevel: 25,
  highestUnlockedRoute: 12,
  routeBestRotations: {},
  rushBestScore: 0,
  rushBestBoards: 0,
});
const russianStrings = ['Уровень', 'Маршрут', 'Спринт', 'Запустить', 'Сбросить', 'Время', 'Счёт', 'Комбо', 'Готово', 'Дальше', 'Уровни', 'Старт', 'Цель', 'Главная', 'Ещё раз', 'Повороты', 'Путь оборвался'];

const sleep = (ms) => new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
const run = (command, args) => {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' && command.endsWith('.cmd') });
  if (result.status !== 0) throw new Error(`${command} exited with ${result.status}`);
};

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

async function makePage(browser, width, height) {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await waitForServer(page);
  await page.evaluate((save) => {
    localStorage.setItem('arrow-shift-save', save);
    location.reload();
  }, tempSave);
  await page.waitForSelector('.home-screen');
  await sleep(180);
  page.__errors = errors;
  page.__context = context;
  return page;
}

async function assertEnglish(page, scene) {
  const text = await page.locator('body').innerText();
  const found = russianStrings.filter((value) => text.includes(value));
  if (found.length) throw new Error(`${scene}: Russian strings found in EN capture: ${found.join(', ')}`);
}

async function openPuzzle(page, level) {
  await page.getByTestId('puzzle-mode-button').click();
  await page.getByTestId(`level-button-${level}`).click();
  await page.waitForSelector('.game-shell');
  await sleep(260);
  await assertEnglish(page, `Puzzle ${level}`);
}

async function openRoute(page, level) {
  await page.getByTestId('route-mode-button').click();
  await page.getByTestId(`route-level-button-${level}`).click();
  await page.waitForSelector('.route-shell');
  await sleep(260);
  await assertEnglish(page, `Route ${level}`);
}

async function openRush(page) {
  await page.getByTestId('rush-mode-button').click();
  await page.waitForSelector('.rush-shell');
  await sleep(300);
  await assertEnglish(page, 'Rush');
}

async function boardSnapshot(page) {
  return page.evaluate(() => {
    const board = document.querySelector('.board');
    const arrows = [...document.querySelectorAll('button.arrow-tile')].map((button) => ({
      id: button.dataset.arrowId,
      row: Number.parseInt(button.style.gridRow, 10) - 1,
      col: Number.parseInt(button.style.gridColumn, 10) - 1,
      direction: button.querySelector('[data-direction]')?.dataset.direction ?? 'right',
    }));
    const barriers = [...document.querySelectorAll('.barrier-tile')].map((barrier) => ({
      row: Number.parseInt(barrier.style.gridRow, 10) - 1,
      col: Number.parseInt(barrier.style.gridColumn, 10) - 1,
    }));
    return { rows: Number(board?.style.getPropertyValue('--rows') ?? 0), cols: Number(board?.style.getPropertyValue('--columns') ?? 0), arrows, barriers };
  });
}

function availableMoves(state) {
  const occupied = new Set(state.arrows.map((arrow) => `${arrow.row},${arrow.col}`));
  const barriers = new Set(state.barriers.map((barrier) => `${barrier.row},${barrier.col}`));
  const vectors = { up: [-1, 0], right: [0, 1], down: [1, 0], left: [0, -1] };
  return state.arrows.filter((arrow) => {
    const [dr, dc] = vectors[arrow.direction] ?? vectors.right;
    let row = arrow.row + dr;
    let col = arrow.col + dc;
    while (row >= 0 && row < state.rows && col >= 0 && col < state.cols) {
      if (occupied.has(`${row},${col}`) || barriers.has(`${row},${col}`)) return false;
      row += dr;
      col += dc;
    }
    return true;
  });
}

async function clearOneRushBoard(page, count = 3) {
  for (let index = 0; index < count; index += 1) {
    const state = await boardSnapshot(page);
    const move = availableMoves(state)[0] ?? state.arrows[0];
    if (!move) break;
    const tile = page.locator(`[data-arrow-id="${move.id}"]`);
    if (!(await tile.count())) break;
    await tile.click();
    await sleep(230);
  }
}

async function capture(page, path, scene) {
  await assertEnglish(page, scene);
  await page.screenshot({ path, animations: 'disabled', caret: 'hide' });
}

async function captureSet(browser, width, height, directory, platform) {
  const names = {
    puzzle: `01-${platform}-puzzle.png`,
    hard: `02-${platform}-puzzle-hard.png`,
    route: `03-${platform}-route.png`,
    rush: `04-${platform}-rush.png`,
  };
  const page = await makePage(browser, width, height);
  try {
    await openPuzzle(page, 20);
    await capture(page, join(directory, names.puzzle), `${platform} Puzzle`);

    await page.getByTestId('game-home-button').click();
    await sleep(180);
    await openPuzzle(page, 30);
    await capture(page, join(directory, names.hard), `${platform} Puzzle hard`);

    await page.getByTestId('game-home-button').click();
    await sleep(180);
    await openRoute(page, 8);
    await capture(page, join(directory, names.route), `${platform} Route`);

    await page.getByTestId('game-home-button').click();
    await sleep(180);
    await openRush(page);
    await clearOneRushBoard(page, 3);
    await capture(page, join(directory, names.rush), `${platform} Rush`);

    if (page.__errors.length) throw new Error(`${platform}: console errors: ${page.__errors.join(' | ')}`);
  } finally {
    await page.__context.close();
  }
}

async function main() {
  mkdirSync(mobileDir, { recursive: true });
  mkdirSync(desktopDir, { recursive: true });
  for (const directory of [mobileDir, desktopDir]) {
    for (const name of ['01-mobile-puzzle.png', '01-mobile-puzzle-hard.png', '01-mobile-route.png', '01-mobile-rush.png', '02-mobile-puzzle-hard.png', '03-mobile-route.png', '04-mobile-rush.png', '01-desktop-puzzle.png', '01-desktop-puzzle-hard.png', '01-desktop-route.png', '01-desktop-rush.png', '02-desktop-puzzle-hard.png', '03-desktop-route.png', '04-desktop-rush.png']) {
      const path = join(directory, name);
      if (existsSync(path)) rmSync(path);
    }
  }

  run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build']);
  const viteBin = join(root, 'node_modules', 'vite', 'bin', 'vite.js');
  const server = spawn(process.execPath, [viteBin, 'preview', '--host', '127.0.0.1', '--port', String(port)], { cwd: root, stdio: 'ignore', windowsHide: true });
  const browser = await chromium.launch({ headless: true });
  try {
    await captureSet(browser, 720, 1280, mobileDir, 'mobile');
    await captureSet(browser, 1280, 720, desktopDir, 'desktop');
  } finally {
    await browser.close();
    server.kill();
  }
  console.log(`EN_SCREENSHOTS=${mobileDir},${desktopDir}`);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
