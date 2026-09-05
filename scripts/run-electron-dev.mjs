import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const electronCli = path.join(rootDir, 'node_modules', 'electron', 'cli.js');

const DEV_HOSTS = (process.env.VITE_DEV_HOSTS || process.env.VITE_DEV_HOST || '127.0.0.1,localhost')
  .split(',')
  .map((host) => host.trim())
  .filter(Boolean);
const DEV_PORT_START = Number(process.env.VITE_DEV_PORT_START || '5173');
const DEV_PORT_END = Number(process.env.VITE_DEV_PORT_END || '5190');
const STARTUP_TIMEOUT_MS = Number(process.env.VITE_DISCOVERY_TIMEOUT_MS || '45000');
const RETRY_DELAY_MS = 300;
const EXPLICIT_RENDERER_URL = String(process.env.ELECTRON_RENDERER_URL || '').trim();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isViteServer = async (baseUrl) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1200);

  try {
    const res = await fetch(`${baseUrl}/@vite/client`, {
      signal: controller.signal,
      headers: { Accept: 'text/javascript' },
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
};

const discoverViteUrl = async () => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < STARTUP_TIMEOUT_MS) {
    for (const host of DEV_HOSTS) {
      for (let port = DEV_PORT_END; port >= DEV_PORT_START; port -= 1) {
        const baseUrl = `http://${host}:${port}`;
        // Match the actual Vite dev server, not just any process bound to a port.
        // eslint-disable-next-line no-await-in-loop
        if (await isViteServer(baseUrl)) {
          return baseUrl;
        }
      }
    }
    // eslint-disable-next-line no-await-in-loop
    await sleep(RETRY_DELAY_MS);
  }

  throw new Error(
    `Could not find a Vite dev server on ${DEV_HOSTS.join(',')}:${DEV_PORT_START}-${DEV_PORT_END} within ${STARTUP_TIMEOUT_MS}ms.`
  );
};

const launchElectron = async () => {
  const rendererUrl = EXPLICIT_RENDERER_URL || await discoverViteUrl();
  const childEnv = {
    ...process.env,
    ELECTRON_DEV: 'true',
    ELECTRON_RENDERER_URL: rendererUrl,
  };

  delete childEnv.ELECTRON_RUN_AS_NODE;

  const child = spawn(process.execPath, [electronCli, 'electron/main-cjs.js'], {
    cwd: rootDir,
    stdio: 'inherit',
    env: childEnv,
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
};

launchElectron().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
