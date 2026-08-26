import { spawnSync } from 'node:child_process';
import { mkdirSync, existsSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const ffmpeg = join(root, 'node_modules', 'ffmpeg-static', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
if (!existsSync(ffmpeg)) throw new Error(`ffmpeg-static binary not found: ${ffmpeg}`);

const jobs = [
  {
    input: join(root, 'store-assets', 'video', 'arrow-shift-gameplay-1920x1080.mp4'),
    output: join(root, 'store-assets', 'video', 'arrow-shift-gameplay-ru-yandex-1920x1080.mp4'),
    preview: join(root, 'store-assets', 'video', 'arrow-shift-gameplay-ru-yandex-preview.png'),
  },
  {
    input: join(root, 'store-assets', 'en', 'video', 'arrow-shift-gameplay-en-1920x1080.mp4'),
    output: join(root, 'store-assets', 'en', 'video', 'arrow-shift-gameplay-en-yandex-1920x1080.mp4'),
    preview: join(root, 'store-assets', 'en', 'video', 'arrow-shift-gameplay-en-yandex-preview.png'),
  },
];

const run = (args) => {
  const result = spawnSync(ffmpeg, args, { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`ffmpeg exited with ${result.status}`);
};

for (const job of jobs) {
  if (!existsSync(job.input)) throw new Error(`Missing source video: ${job.input}`);
  mkdirSync(resolve(job.output, '..'), { recursive: true });
  rmSync(job.output, { force: true });
  // Conservative Yandex upload profile: CFR H.264 Main/4.0 plus a silent AAC-LC track.
  run([
    '-y', '-hide_banner', '-loglevel', 'error',
    '-i', job.input,
    // Near-silent -100 dBFS noise keeps the AAC stream at the requested CBR without audible content.
    '-f', 'lavfi', '-i', 'anoisesrc=color=white:amplitude=0.00001:sample_rate=48000',
    '-map', '0:v:0', '-map', '1:a:0',
    '-c:v', 'libx264', '-profile:v', 'main', '-level:v', '4.0',
    '-pix_fmt', 'yuv420p', '-r', '30', '-fps_mode', 'cfr',
    '-g', '60', '-keyint_min', '60', '-sc_threshold', '0', '-bf', '0',
    '-preset', 'medium', '-crf', '19',
    '-c:a', 'aac', '-profile:a', 'aac_low', '-b:a', '128k', '-ar', '48000', '-ac', '2',
    '-af', 'apad', '-shortest', '-avoid_negative_ts', 'make_zero',
    '-movflags', '+faststart', job.output,
  ]);
  rmSync(job.preview, { force: true });
  run(['-y', '-hide_banner', '-loglevel', 'error', '-ss', '10.0', '-i', job.output, '-frames:v', '1', '-vf', 'scale=960:540', job.preview]);
  console.log(`Prepared ${job.output}`);
}
