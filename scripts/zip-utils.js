import { deflateRawSync } from 'node:zlib';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const LOCAL_HEADER = 0x04034b50;
const CENTRAL_HEADER = 0x02014b50;
const END_HEADER = 0x06054b50;

export function toZipPath(relativeName) {
  return relativeName.split(/[\\/]+/).filter(Boolean).join('/');
}

export function zipEntryIssues(entryName) {
  const parts = entryName.split('/');
  const issues = [];
  if (entryName.includes('\\')) issues.push('backslash');
  if (/^[A-Za-z]:/.test(entryName)) issues.push('drive-letter');
  if (entryName.startsWith('/')) issues.push('absolute');
  if (parts.includes('..')) issues.push('parent');
  return issues;
}

function walk(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function createZipArchive(sourceDirectory, destination) {
  const files = walk(sourceDirectory).map((absolute) => ({
    name: toZipPath(relative(sourceDirectory, absolute)),
    data: readFileSync(absolute),
  }));
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  for (const file of files) {
    const name = Buffer.from(file.name, 'utf8');
    const compressed = deflateRawSync(file.data, { level: 6 });
    const checksum = crc32(file.data);
    const local = Buffer.alloc(30 + name.length);
    local.writeUInt32LE(LOCAL_HEADER, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x800, 6);
    local.writeUInt16LE(8, 8); local.writeUInt32LE(checksum, 14); local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(file.data.length, 22); local.writeUInt16LE(name.length, 26); name.copy(local, 30);
    localParts.push(local);

    const central = Buffer.alloc(46 + name.length);
    central.writeUInt32LE(CENTRAL_HEADER, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x800, 8); central.writeUInt16LE(8, 10); central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(compressed.length, 20); central.writeUInt32LE(file.data.length, 24);
    central.writeUInt16LE(name.length, 28); central.writeUInt32LE(offset, 42); name.copy(central, 46);
    centralParts.push(central);
    offset += local.length + compressed.length;
    localParts.push(compressed);
  }
  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(END_HEADER, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12); end.writeUInt32LE(offset, 16);
  writeFileSync(destination, Buffer.concat([...localParts, centralDirectory, end]));
  return files.map(({ name }) => name);
}

export function readZipEntryNames(archivePath) {
  const data = readFileSync(archivePath);
  let end = -1;
  for (let index = data.length - 22; index >= Math.max(0, data.length - 0xffff - 22); index -= 1) {
    if (data.readUInt32LE(index) === END_HEADER) { end = index; break; }
  }
  if (end < 0) throw new Error('ZIP end record not found');
  const count = data.readUInt16LE(end + 10);
  const centralOffset = data.readUInt32LE(end + 16);
  const names = [];
  let cursor = centralOffset;
  for (let index = 0; index < count; index += 1) {
    if (data.readUInt32LE(cursor) !== CENTRAL_HEADER) throw new Error('ZIP central directory is invalid');
    const nameLength = data.readUInt16LE(cursor + 28);
    const extraLength = data.readUInt16LE(cursor + 30);
    const commentLength = data.readUInt16LE(cursor + 32);
    names.push(data.subarray(cursor + 46, cursor + 46 + nameLength).toString('utf8'));
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  return names;
}
