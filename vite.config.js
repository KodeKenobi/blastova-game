import fs from 'fs/promises';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const PREVIEW_ICON_ADJUSTMENTS_FILE = path.resolve(
  process.cwd(),
  'public/assets/generated/preview-icon-adjustments.json'
);
const COMMANDER_STORE_FILE = path.resolve(
  process.cwd(),
  'server/data/commander-store.json'
);
const LIGHTNING_TRIGGER_UI_FILE = path.resolve(
  process.cwd(),
  'src/systems/game-lightning-control-ui-system.js'
);
const COMMANDER_STORE_TABLE = 'commander_store';
const COMMANDER_STORE_ROW_ID = 'global';
const SUPABASE_DB_URL = String(
  process.env.SUPABASE_DB_URL
  || process.env.DATABASE_URL
  || process.env.POSTGRES_URL
  || ''
).trim();
let commanderStorePgClientPromise = null;

function hasPostgresCommanderStore() {
  return !!SUPABASE_DB_URL;
}

function releaseUiPlugin() {
  const releaseBuild = process.env.VITE_RELEASE_BUILD === '1';
  if (!releaseBuild) return null;
  return {
    name: 'release-ui',
    transformIndexHtml(html) {
      return html
        .replace(/\s*<div class="sp-toggle-row" id="gp-row-pathguide">[\s\S]*?<\/div>\s*/g, '\n')
        .replace(/\s*<div class="sp-toggle-row" id="gp-row-dev-unlock-worlds">[\s\S]*?<\/div>\s*/g, '\n')
        .replace(/\s*<div class="sp-toggle-row" id="gp-row-dev-tools">[\s\S]*?<\/div>\s*/g, '\n');
    },
  };
}

function normalizeCommanderName(name) {
  const trimmed = String(name || '').replace(/\s+/g, ' ').trim();
  return trimmed ? trimmed.slice(0, 24) : 'Player';
}

function normalizeCommanderStore(payload) {
  const source = payload && typeof payload === 'object' ? payload : {};
  const profile = source.profile && typeof source.profile === 'object' ? source.profile : {};
  const leaderboard = Array.isArray(source.leaderboard) ? source.leaderboard : [];
  const profileUpdatedAt = Math.max(0, Number(profile.updatedAt || source.profileUpdatedAt) || 0);
  const leaderboardUpdatedAt = Math.max(0, Number(source.leaderboardUpdatedAt) || 0);

  const normalizedProfile = {
    level: Math.max(1, Number(profile.level) || 1),
    xp: Math.max(0, Number(profile.xp) || 0),
    worldsCleared: Array.isArray(profile.worldsCleared) ? profile.worldsCleared.slice() : [],
    name: normalizeCommanderName(profile.name),
    updatedAt: profileUpdatedAt,
  };

  const normalizedLeaderboard = leaderboard
    .map((entry) => ({
      name: normalizeCommanderName(entry && entry.name),
      score: Math.max(0, Number(entry && entry.score) || 0),
      updatedAt: Math.max(0, Number(entry && entry.updatedAt) || 0),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => (b.score - a.score) || (b.updatedAt - a.updatedAt))
    .slice(0, 5);

  return {
    profile: normalizedProfile,
    leaderboard: normalizedLeaderboard,
    profileUpdatedAt,
    leaderboardUpdatedAt,
  };
}

async function readCommanderStore() {
  if (hasPostgresCommanderStore()) {
    const remote = await readCommanderStoreFromPostgres();
    if (remote) return remote;
  }
  try {
    const raw = await fs.readFile(COMMANDER_STORE_FILE, 'utf8');
    return normalizeCommanderStore(JSON.parse(raw));
  } catch (_) {
    return normalizeCommanderStore({});
  }
}

async function writeCommanderStore(payload) {
  const normalized = normalizeCommanderStore(payload);
  if (hasPostgresCommanderStore()) {
    const wrote = await writeCommanderStoreToPostgres(normalized);
    if (wrote) return normalized;
  }
  await fs.mkdir(path.dirname(COMMANDER_STORE_FILE), { recursive: true });
  await fs.writeFile(COMMANDER_STORE_FILE, JSON.stringify(normalized, null, 2) + '\n', 'utf8');
  return normalized;
}

async function getCommanderStorePgClient() {
  if (!hasPostgresCommanderStore()) return null;
  if (!commanderStorePgClientPromise) {
    commanderStorePgClientPromise = (async () => {
      try {
        const pgModule = await import('pg');
        const ClientCtor = pgModule && (pgModule.Client || (pgModule.default && pgModule.default.Client));
        if (!ClientCtor) return null;
        const client = new ClientCtor({
          connectionString: SUPABASE_DB_URL,
          ssl: { rejectUnauthorized: false },
        });
        await client.connect();
        await client.query(
          `CREATE TABLE IF NOT EXISTS ${COMMANDER_STORE_TABLE} (
            id TEXT PRIMARY KEY,
            payload JSONB NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )`
        );
        return client;
      } catch (error) {
        console.warn('[commander-store] Postgres init failed, using file fallback:', error && error.message ? error.message : error);
        return null;
      }
    })();
  }
  return commanderStorePgClientPromise;
}

async function readCommanderStoreFromPostgres() {
  try {
    const client = await getCommanderStorePgClient();
    if (!client) return null;
    const result = await client.query(
      `SELECT payload FROM ${COMMANDER_STORE_TABLE} WHERE id = $1 LIMIT 1`,
      [COMMANDER_STORE_ROW_ID]
    );
    const row = result && result.rows && result.rows[0] ? result.rows[0] : null;
    if (!row || !row.payload) return normalizeCommanderStore({});
    return normalizeCommanderStore(row.payload);
  } catch (error) {
    console.warn('[commander-store] Postgres read failed, falling back to file:', error && error.message ? error.message : error);
    return null;
  }
}

async function writeCommanderStoreToPostgres(payload) {
  try {
    const client = await getCommanderStorePgClient();
    if (!client) return false;
    await client.query(
      `INSERT INTO ${COMMANDER_STORE_TABLE} (id, payload, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (id)
       DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()`,
      [COMMANDER_STORE_ROW_ID, JSON.stringify(payload)]
    );
    return true;
  } catch (error) {
    console.warn('[commander-store] Postgres write failed, falling back to file:', error && error.message ? error.message : error);
    return false;
  }
}

function commanderStorePlugin() {
  const route = '/__commander-store';

  const handler = async (req, res) => {
    if (!req.url || !req.url.startsWith(route)) return false;

    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (req.method === 'GET') {
      const data = await readCommanderStore();
      res.statusCode = 200;
      res.end(JSON.stringify({ ok: true, data }));
      return true;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', async () => {
        try {
          const payload = body ? JSON.parse(body) : {};
          const current = await readCommanderStore();
          const incoming = normalizeCommanderStore(payload);

          const nextProfile = incoming.profileUpdatedAt >= current.profileUpdatedAt
            ? incoming.profile
            : current.profile;
          const nextLeaderboard = incoming.leaderboardUpdatedAt >= current.leaderboardUpdatedAt
            ? incoming.leaderboard
            : current.leaderboard;

          const written = await writeCommanderStore({
            profile: nextProfile,
            leaderboard: nextLeaderboard,
            profileUpdatedAt: Math.max(current.profileUpdatedAt, incoming.profileUpdatedAt),
            leaderboardUpdatedAt: Math.max(current.leaderboardUpdatedAt, incoming.leaderboardUpdatedAt),
          });

          res.statusCode = 200;
          res.end(JSON.stringify({ ok: true, data: written }));
        } catch (error) {
          res.statusCode = 400;
          res.end(JSON.stringify({ ok: false, error: error && error.message ? error.message : 'write_failed' }));
        }
      });
      return true;
    }

    res.statusCode = 405;
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return true;
  };

  return {
    name: 'commander-store-endpoint',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        handler(req, res).then((handled) => {
          if (!handled) next();
        }).catch(next);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        handler(req, res).then((handled) => {
          if (!handled) next();
        }).catch(next);
      });
    },
  };
}

function normalizePreviewAdjustments(payload) {
  const source = payload && typeof payload === 'object' ? payload : {};
  const normalizeEntryMap = (entries) => {
    const out = {};
    Object.keys(entries || {}).forEach((key) => {
      const normalizedKey = String(key || '').trim().toLowerCase();
      if (!normalizedKey) return;
      const value = entries[key] && typeof entries[key] === 'object' ? entries[key] : {};
      let x = Number(value.x);
      let y = Number(value.y);
      let scale = Number(value.scale);
      if (!Number.isFinite(x)) x = 0;
      if (!Number.isFinite(y)) y = 0;
      if (!Number.isFinite(scale) || scale <= 0) scale = 1;
      out[normalizedKey] = {
        x: Math.max(-40, Math.min(40, x)),
        y: Math.max(-40, Math.min(40, y)),
        scale: Math.max(0.3, Math.min(2.6, scale)),
      };
    });
    return out;
  };

  const hasProfiles = ['desktop', 'mobile'].some((profileKey) => source[profileKey] && typeof source[profileKey] === 'object');
  if (hasProfiles) {
    return {
      desktop: normalizeEntryMap(source.desktop),
      mobile: normalizeEntryMap(source.mobile),
    };
  }

  return {
    desktop: normalizeEntryMap(source),
    mobile: normalizeEntryMap(source),
  };
}

async function readPreviewIconAdjustments() {
  try {
    const raw = await fs.readFile(PREVIEW_ICON_ADJUSTMENTS_FILE, 'utf8');
    return normalizePreviewAdjustments(JSON.parse(raw));
  } catch (_) {
    return null;
  }
}

async function writePreviewIconAdjustments(payload) {
  const normalized = normalizePreviewAdjustments(payload);
  await fs.mkdir(path.dirname(PREVIEW_ICON_ADJUSTMENTS_FILE), { recursive: true });
  await fs.writeFile(PREVIEW_ICON_ADJUSTMENTS_FILE, JSON.stringify(normalized, null, 2) + '\n', 'utf8');
  return normalized;
}

function previewIconAdjustmentsPlugin() {
  const route = '/__preview-icon-adjustments';
  const handler = async (req, res) => {
    if (!req.url || !req.url.startsWith(route)) return false;

    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (req.method === 'GET') {
      const parsed = await readPreviewIconAdjustments();
      res.statusCode = parsed ? 200 : 404;
      res.end(JSON.stringify(parsed || { error: 'not_found' }));
      return true;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', async () => {
        try {
          const payload = body ? JSON.parse(body) : {};
          const normalized = await writePreviewIconAdjustments(payload);
          res.statusCode = 200;
          res.end(JSON.stringify({ ok: true, data: normalized, path: PREVIEW_ICON_ADJUSTMENTS_FILE }));
        } catch (error) {
          res.statusCode = 400;
          res.end(JSON.stringify({ ok: false, error: error && error.message ? error.message : 'write_failed' }));
        }
      });
      return true;
    }

    res.statusCode = 405;
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return true;
  };

  return {
    name: 'preview-icon-adjustments-endpoint',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        handler(req, res).then((handled) => {
          if (!handled) next();
        }).catch(next);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        handler(req, res).then((handled) => {
          if (!handled) next();
        }).catch(next);
      });
    },
  };
}

function normalizeLightningTriggerPoints(payload) {
  const points = Array.isArray(payload) ? payload : [];
  return points
    .map((point) => ({
      x: Math.round(Number(point && point.x)),
      y: Math.round(Number(point && point.y)),
    }))
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
    .slice(0, 24);
}

function upsertWorldLightningPoints(source, worldId, points) {
  const normalizedWorldId = Math.max(0, Math.floor(Number(worldId) || 0));
  const normalizedPoints = normalizeLightningTriggerPoints(points);
  if (normalizedPoints.length === 0) {
    throw new Error('invalid_points');
  }

  const entryBlock = [
    `  ${normalizedWorldId}: [`,
    ...normalizedPoints.map((point) => `    { x: ${point.x}, y: ${point.y} },`),
    '  ],',
  ].join('\n');

  const objectStart = source.indexOf('const WORLD_LIGHTNING_TRIGGER_POINT_GROUPS = {');
  if (objectStart < 0) {
    throw new Error('point_groups_not_found');
  }
  const objectEnd = source.indexOf('\n};', objectStart);
  if (objectEnd < 0) {
    throw new Error('point_groups_end_not_found');
  }

  const entryRegex = new RegExp(`(^\\s*${normalizedWorldId}:\\s*\\[[\\s\\S]*?^\\s*\\],)`, 'm');
  if (entryRegex.test(source)) {
    return source.replace(entryRegex, entryBlock);
  }

  return source.slice(0, objectEnd) + '\n' + entryBlock + source.slice(objectEnd);
}

async function saveWorldLightningPointsToSource(worldId, points) {
  const source = await fs.readFile(LIGHTNING_TRIGGER_UI_FILE, 'utf8');
  const updated = upsertWorldLightningPoints(source, worldId, points);
  await fs.writeFile(LIGHTNING_TRIGGER_UI_FILE, updated, 'utf8');
}

function lightningTriggerPointsPlugin() {
  const route = '/__lightning-trigger-points';

  const handler = async (req, res) => {
    if (!req.url || !req.url.startsWith(route)) return false;

    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
      return true;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', async () => {
      try {
        const payload = body ? JSON.parse(body) : {};
        const worldId = Math.max(0, Math.floor(Number(payload.worldId) || 0));
        const points = normalizeLightningTriggerPoints(payload.points);
        if (points.length === 0) {
          throw new Error('invalid_points');
        }
        await saveWorldLightningPointsToSource(worldId, points);
        res.statusCode = 200;
        res.end(JSON.stringify({ ok: true, worldId, points, path: LIGHTNING_TRIGGER_UI_FILE }));
      } catch (error) {
        res.statusCode = 400;
        res.end(JSON.stringify({ ok: false, error: error && error.message ? error.message : 'write_failed' }));
      }
    });
    return true;
  };

  return {
    name: 'lightning-trigger-points-endpoint',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        handler(req, res).then((handled) => {
          if (!handled) next();
        }).catch(next);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        handler(req, res).then((handled) => {
          if (!handled) next();
        }).catch(next);
      });
    },
  };
}

export default defineConfig({
  plugins: [
    releaseUiPlugin(),
    commanderStorePlugin(),
    previewIconAdjustmentsPlugin(),
    lightningTriggerPointsPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['apple-touch-icon.png', 'icons/icon-256.png', 'icons/icon-1024.png'],
      manifest: {
        name: 'Blastova',
        short_name: 'Blastova',
        description: 'Blastova - defend against endless waves.',
        theme_color: '#070d14',
        background_color: '#070d14',
        display: 'fullscreen',
        orientation: 'landscape',
        start_url: './',
        scope: './',
        icons: [
          {
            src: 'icons/icon-256.png',
            sizes: '256x256',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: 'icons/icon-1024.png',
            sizes: '1024x1024',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // Only use SPA fallback for the app root. Embedded HTML documents like
        // tower-blueprints.html must resolve as real files on mobile WebView.
        navigateFallbackAllowlist: [/^\/$/],
      },
    }),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: false,
    watch: {
      ignored: [
        '**/android/**',
        '**/build/**',
        '**/dev-dist/**',
        '**/dist/**',
        '**/release-artifacts/**',
        '**/*-unpacked/**',
      ],
    },
  },
  preview: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 4173,
    strictPort: false,
    allowedHosts: true,
  },
});
