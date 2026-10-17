/**
 * Mağaza simgelerini ve açılış görsellerini üretir.
 *
 *   node scripts/make-assets.mjs          # assets-src/*.svg → assets/*.png
 *   npx capacitor-assets generate         # assets/*.png → ios/ ve android/ içindeki tüm boyutlar
 *
 * (npm run assets ikisini birlikte yapar.)
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = (f) => resolve(root, 'assets-src', f);
const out = (f) => resolve(root, 'assets', f);

/** iOS simgelerinde şeffaflık yasak → saydam olmayanlar düz zemine oturtulur. */
const JOBS = [
  { in: 'icon.svg', out: 'icon.png', size: 1024, flatten: '#ff6b4a' },
  { in: 'icon-foreground.svg', out: 'icon-foreground.png', size: 1024 },
  { in: 'icon-background.svg', out: 'icon-background.png', size: 1024, flatten: '#ff6b4a' },
  { in: 'splash.svg', out: 'splash.png', size: 2732, flatten: '#cfeee6' },
  { in: 'splash-dark.svg', out: 'splash-dark.png', size: 2732, flatten: '#123b36' },
];

await mkdir(resolve(root, 'assets'), { recursive: true });
for (const job of JOBS) {
  // SVG doğrudan hedef boyutta taranır (density) → küçültme bulanıklığı olmaz.
  let img = sharp(await readFile(src(job.in)), { density: 384 }).resize(job.size, job.size, { fit: 'cover' });
  if (job.flatten) img = img.flatten({ background: job.flatten });
  await writeFile(out(job.out), await img.png({ compressionLevel: 9 }).toBuffer());
  console.log(`✓ assets/${job.out}  ${job.size}×${job.size}`);
}
