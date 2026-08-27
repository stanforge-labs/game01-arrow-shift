import { afterEach, describe, expect, it } from 'vitest';
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createZipArchive, readZipEntryNames, toZipPath, zipEntryIssues } from './zip-utils.js';

let temporaryDirectory;
afterEach(() => { if (temporaryDirectory && existsSync(temporaryDirectory)) rmSync(temporaryDirectory, { recursive: true, force: true }); });

describe('release ZIP packaging', () => {
  it('release zip uses POSIX entry paths', () => {
    expect(toZipPath('assets\\index.js')).toBe('assets/index.js');
    expect(zipEntryIssues('assets\\index.js')).toContain('backslash');
    expect(zipEntryIssues('assets/index.js')).toEqual([]);
  });

  it('extractable archive preserves the assets directory structure', () => {
    temporaryDirectory = mkdtempSync(join(tmpdir(), 'arrow-shift-zip-'));
    const source = join(temporaryDirectory, 'dist'); const assets = join(source, 'assets');
    mkdirSync(assets, { recursive: true });
    writeFileSync(join(source, 'index.html'), '<script src="./assets/app.js"></script>');
    writeFileSync(join(assets, 'app.js'), 'console.log(1);');
    const archive = join(temporaryDirectory, 'release.zip');
    createZipArchive(source, archive);
    expect(readZipEntryNames(archive)).toEqual(['assets/app.js', 'index.html']);
  });
});
