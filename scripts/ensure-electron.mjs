import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const electronDir = path.join(rootDir, 'node_modules', 'electron');
const electronBinaryDir = path.join(electronDir, 'dist');
const installerPath = path.join(electronDir, 'install.js');

if (fs.existsSync(electronBinaryDir)) {
  process.exit(0);
}

if (!fs.existsSync(installerPath)) {
  console.error('Electron is not installed. Run npm install first.');
  process.exit(1);
}

console.log('Electron runtime missing. Downloading it now...');
const result = spawnSync(process.execPath, [installerPath], {
  cwd: rootDir,
  stdio: 'inherit',
  env: process.env,
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

if (!fs.existsSync(electronBinaryDir)) {
  console.error('Electron runtime is still missing after install.');
  process.exit(1);
}
