import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('dist');

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

const files = (await collectFiles(root))
  .filter((file) => path.basename(file) !== 'production-manifest.sha256')
  .sort();
const manifest = [];
for (const file of files) {
  const digest = createHash('sha256');
  const input = createReadStream(file);
  for await (const chunk of input) digest.update(chunk);
  const relativePath = path.relative(root, file).split(path.sep).join('/');
  const size = (await stat(file)).size;
  manifest.push(`${digest.digest('hex')}  ${size}  ${relativePath}`);
}

const output = `${manifest.join('\n')}\n`;
await writeFile(path.join(root, 'production-manifest.sha256'), output);
process.stdout.write(output);
