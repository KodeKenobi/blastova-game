import QRCode from 'qrcode';

function normalizeTransport(value) {
  return value === 'nearby' ? 'nearby' : 'online';
}

function normalizeRole(value) {
  return value === 'enemyCommander' ? 'enemyCommander' : 'defender';
}

function normalizeDifficulty(value) {
  const difficulty = String(value || 'normal').toLowerCase();
  return difficulty === 'easy' || difficulty === 'hard' ? difficulty : 'normal';
}

function toBase64Url(text) {
  const input = String(text || '');
  if (!input) return '';
  if (typeof btoa === 'function') {
    return btoa(unescape(encodeURIComponent(input)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(input, 'utf8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }
  return input;
}

function fromBase64Url(text) {
  const input = String(text || '');
  if (!input) return '';
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '==='.slice((normalized.length + 3) % 4);
  if (typeof atob === 'function') {
    try {
      return decodeURIComponent(escape(atob(padded)));
    } catch (_) {
      return '';
    }
  }
  if (typeof Buffer !== 'undefined') {
    try {
      return Buffer.from(padded, 'base64').toString('utf8');
    } catch (_) {
      return '';
    }
  }
  return '';
}

export function buildMultiplayerInvitePayload(input = {}) {
  return {
    version: 1,
    transport: normalizeTransport(input.transport),
    wsUrl: String(input.wsUrl || '').trim(),
    role: normalizeRole(input.role),
    worldId: Number.isFinite(Number(input.worldId)) ? Number(input.worldId) : 0,
    difficulty: normalizeDifficulty(input.difficulty),
    matchId: String(input.matchId || '').trim(),
    host: !!input.host,
    createdAt: Number.isFinite(Number(input.createdAt)) ? Number(input.createdAt) : Date.now(),
  };
}

export function encodeMultiplayerInvite(input = {}) {
  const payload = buildMultiplayerInvitePayload(input);
  return 'blastova://join?i=' + toBase64Url(JSON.stringify(payload));
}

export function decodeMultiplayerInvite(text) {
  const raw = String(text || '').trim();
  if (!raw) return null;

  let encoded = '';
  try {
    const parsedUrl = new URL(raw);
    if (parsedUrl.protocol === 'blastova:' && parsedUrl.hostname === 'join') {
      encoded = parsedUrl.searchParams.get('i') || '';
    }
    if (!encoded && parsedUrl.searchParams.get('i')) {
      encoded = parsedUrl.searchParams.get('i') || '';
    }
  } catch (_) {}

  if (!encoded && raw.startsWith('blastova://join?i=')) {
    encoded = raw.slice('blastova://join?i='.length);
  }

  if (!encoded && raw.startsWith('BLASTOVA1:')) {
    encoded = raw.slice('BLASTOVA1:'.length);
  }

  if (!encoded && raw.includes('{')) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return buildMultiplayerInvitePayload(parsed);
      }
    } catch (_) {}
  }

  if (!encoded) {
    encoded = raw;
  }

  const decoded = fromBase64Url(encoded);
  if (!decoded) return null;

  try {
    const parsed = JSON.parse(decoded);
    return buildMultiplayerInvitePayload(parsed);
  } catch (_) {
    return null;
  }
}

export function normalizeMultiplayerInvite(input = {}) {
  return buildMultiplayerInvitePayload(input);
}

export async function generateMultiplayerInviteQrSvg(text) {
  return QRCode.toString(String(text || ''), {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 240,
    color: {
      dark: '#f4e6ca',
      light: '#0a0f18',
    },
  });
}
