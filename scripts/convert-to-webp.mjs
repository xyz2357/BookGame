import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, extname, basename } from 'path';

const DIRS = ['public/images/books', 'public/images/nodes'];
const QUALITY = 80;

async function convertDir(dir) {
  let files;
  try {
    files = await readdir(dir);
  } catch {
    console.log(`  Skipping ${dir} (not found)`);
    return;
  }

  const pngs = files.filter(f => extname(f).toLowerCase() === '.png');
  console.log(`\n${dir}: ${pngs.length} PNG files`);

  for (const file of pngs) {
    const input = join(dir, file);
    const output = join(dir, basename(file, extname(file)) + '.webp');
    const { size: beforeSize } = await stat(input);

    await sharp(input)
      .webp({ quality: QUALITY })
      .toFile(output);

    const { size: afterSize } = await stat(output);
    const ratio = ((1 - afterSize / beforeSize) * 100).toFixed(1);
    console.log(`  ${file} → .webp  ${(beforeSize / 1024).toFixed(0)}KB → ${(afterSize / 1024).toFixed(0)}KB  (-${ratio}%)`);
  }
}

for (const dir of DIRS) {
  await convertDir(dir);
}

console.log('\nDone.');
