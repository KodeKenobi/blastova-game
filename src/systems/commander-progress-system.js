const COMMANDER_STORAGE_KEY = 'tdCommanderV2';
const COMMANDER_LEADERBOARD_STORAGE_KEY = 'tdCommanderLeaderboardV1';

// Weapons that can ONLY be unlocked through online play — never through singleplayer level-ups.
export const ONLINE_EXCLUSIVE_WEAPON_IDS = new Set([4, 6, 7, 13]);

// Trigger definitions: each entry describes what must happen online before the weapon is granted.
// condition keys: 'game_played', 'wave5_survived', 'match_won', 'wins3'
export const ONLINE_WEAPON_UNLOCK_TRIGGERS = [
  { weaponId: 4,  condition: 'game_played',    label: 'Play any online match'               },
  { weaponId: 6,  condition: 'wave5_survived', label: 'Survive to wave 5 online'            },
  { weaponId: 7,  condition: 'match_won',      label: 'Win an online match'                 },
  { weaponId: 13, condition: 'wins3',          label: 'Win 3 separate online matches'       },
];

function normalizeCommanderName(name) {
  const trimmed = String(name ?? '').replace(/\s+/g, ' ').trim();
  return trimmed ? trimmed.slice(0, 24) : 'Player';
}

function getFallbackCommanderData() {
  return { level: 1, xp: 0, worldsCleared: [], name: 'Player', onlineUnlocks: { gamesPlayed: 0, wins: 0, maxWaveSurvived: 0, weaponsGranted: [] } };
}

function normalizeOnlineUnlocks(raw) {
  const src = (raw && typeof raw === 'object') ? raw : {};
  return {
    gamesPlayed:    Math.max(0, Number(src.gamesPlayed)    || 0),
    wins:           Math.max(0, Number(src.wins)           || 0),
    maxWaveSurvived:Math.max(0, Number(src.maxWaveSurvived)|| 0),
    weaponsGranted: Array.isArray(src.weaponsGranted) ? src.weaponsGranted.map(Number).filter(Number.isFinite) : [],
  };
}

function getRemoteCommanderSnapshot() {
  return globalThis && globalThis.__tdCommanderStoreSnapshot
    ? globalThis.__tdCommanderStoreSnapshot
    : null;
}

export function loadCommanderData(storage = globalThis?.localStorage) {
  try {
    const raw = storage?.getItem?.(COMMANDER_STORAGE_KEY);
    if (!raw) {
      const snapshot = getRemoteCommanderSnapshot();
      if (snapshot && snapshot.profile && typeof snapshot.profile === 'object') {
        return {
          level: Math.max(1, Number(snapshot.profile.level) || 1),
          xp: Math.max(0, Number(snapshot.profile.xp) || 0),
          worldsCleared: Array.isArray(snapshot.profile.worldsCleared) ? snapshot.profile.worldsCleared.slice() : [],
          name: normalizeCommanderName(snapshot.profile.name),
        };
      }
      return getFallbackCommanderData();
    }
    const parsed = JSON.parse(raw);
    return {
      level: Math.max(1, Number(parsed?.level) || 1),
      xp: Math.max(0, Number(parsed?.xp) || 0),
      worldsCleared: Array.isArray(parsed?.worldsCleared) ? parsed.worldsCleared.slice() : [],
      name: normalizeCommanderName(parsed?.name),
      onlineUnlocks: normalizeOnlineUnlocks(parsed?.onlineUnlocks),
    };
  } catch (_) {
    return getFallbackCommanderData();
  }
}

export function saveCommanderData(data, storage = globalThis?.localStorage) {
  const normalized = {
    level: Math.max(1, Number(data?.level) || 1),
    xp: Math.max(0, Number(data?.xp) || 0),
    worldsCleared: Array.isArray(data?.worldsCleared) ? data.worldsCleared.slice() : [],
    name: normalizeCommanderName(data?.name),
    onlineUnlocks: normalizeOnlineUnlocks(data?.onlineUnlocks),
  };
  const profileUpdatedAt = Date.now();
  try {
    storage?.setItem?.(COMMANDER_STORAGE_KEY, JSON.stringify(normalized));
  } catch (_) {
    // Ignore write failures (private mode / storage access limitations)
  }

  try {
    if (typeof globalThis?.__tdPersistCommanderStore === 'function') {
      globalThis.__tdPersistCommanderStore({
        profile: normalized,
        profileUpdatedAt,
      });
    }
  } catch (_) {
    // Ignore remote sync failures; local persistence still succeeds.
  }
}

export function setCommanderName(data, name) {
  return {
    level: Math.max(1, Number(data?.level) || 1),
    xp: Math.max(0, Number(data?.xp) || 0),
    worldsCleared: Array.isArray(data?.worldsCleared) ? data.worldsCleared.slice() : [],
    name: normalizeCommanderName(name),
  };
}

export function getCommanderDisplayName(data) {
  return normalizeCommanderName(data?.name);
}

export function earnCommanderXP({ data, amount, xpForLevel, onLevelUp }) {
  const next = {
    level: Math.max(1, Number(data?.level) || 1),
    xp: Math.max(0, Number(data?.xp) || 0) + Math.max(0, Number(amount) || 0),
    worldsCleared: Array.isArray(data?.worldsCleared) ? data.worldsCleared.slice() : [],
  };

  while (next.xp >= xpForLevel(next.level)) {
    next.xp -= xpForLevel(next.level);
    next.level += 1;
    if (typeof onLevelUp === 'function') {
      onLevelUp(next.level);
    }
  }

  return next;
}

export function recordWorldCleared(data, worldId) {
  const next = {
    level: Math.max(1, Number(data?.level) || 1),
    xp: Math.max(0, Number(data?.xp) || 0),
    worldsCleared: Array.isArray(data?.worldsCleared) ? data.worldsCleared.slice() : [],
  };

  if (!next.worldsCleared.includes(worldId)) {
    next.worldsCleared.push(worldId);
  }

  return next;
}

export function countClearedByTier(tier, worlds, worldsCleared) {
  const clearedSet = new Set(Array.isArray(worldsCleared) ? worldsCleared : []);
  return (Array.isArray(worlds) ? worlds : []).filter((world) => world.tier === tier && clearedSet.has(world.id)).length;
}

export function isWorldUnlocked(world, worlds, worldsCleared) {
  if (!world) return false;
  if (world.tier === 1) return true;
  const prevTier = world.tier - 1;
  const cleared = countClearedByTier(prevTier, worlds, worldsCleared);
  return cleared >= world.unlockReq;
}

function getFallbackCommanderLeaderboard() {
  return [];
}

export function loadCommanderLeaderboard(storage = globalThis?.localStorage) {
  try {
    const raw = storage?.getItem?.(COMMANDER_LEADERBOARD_STORAGE_KEY);
    if (!raw) {
      const snapshot = getRemoteCommanderSnapshot();
      if (snapshot && Array.isArray(snapshot.leaderboard)) {
        return snapshot.leaderboard
          .map((entry) => ({
            name: normalizeCommanderName(entry?.name),
            score: Math.max(0, Number(entry?.score) || 0),
            updatedAt: Math.max(0, Number(entry?.updatedAt) || 0),
          }))
          .filter((entry) => entry.score > 0)
          .sort((a, b) => (b.score - a.score) || (b.updatedAt - a.updatedAt))
          .slice(0, 5);
      }
      return getFallbackCommanderLeaderboard();
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return getFallbackCommanderLeaderboard();
    return parsed
      .map((entry) => ({
        name: normalizeCommanderName(entry?.name),
        score: Math.max(0, Number(entry?.score) || 0),
        updatedAt: Math.max(0, Number(entry?.updatedAt) || 0),
      }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => (b.score - a.score) || (b.updatedAt - a.updatedAt))
      .slice(0, 5);
  } catch (_) {
    return getFallbackCommanderLeaderboard();
  }
}

export function saveCommanderLeaderboard(entries, storage = globalThis?.localStorage) {
  const normalizedEntries = Array.isArray(entries) ? entries : [];
  const leaderboardUpdatedAt = Date.now();
  try {
    storage?.setItem?.(COMMANDER_LEADERBOARD_STORAGE_KEY, JSON.stringify(normalizedEntries));
  } catch (_) {
    // Ignore write failures (private mode / storage access limitations)
  }

  try {
    if (typeof globalThis?.__tdPersistCommanderStore === 'function') {
      globalThis.__tdPersistCommanderStore({
        leaderboard: normalizedEntries,
        leaderboardUpdatedAt,
      });
    }
  } catch (_) {
    // Ignore remote sync failures; local persistence still succeeds.
  }
}

export function recordCommanderLeaderboardEntry(data, score, storage = globalThis?.localStorage) {
  const name = normalizeCommanderName(data?.name);
  const numericScore = Math.max(0, Number(score) || 0);
  if (!numericScore) {
    return loadCommanderLeaderboard(storage);
  }

  const next = loadCommanderLeaderboard(storage).slice();
  const existingIndex = next.findIndex((entry) => entry.name === name);
  const currentEntry = {
    name,
    score: numericScore,
    updatedAt: Date.now(),
  };

  if (existingIndex >= 0) {
    const existing = next[existingIndex];
    next[existingIndex] = existing.score >= numericScore
      ? existing
      : currentEntry;
  } else {
    next.push(currentEntry);
  }

  const sorted = next
    .map((entry) => ({
      name: normalizeCommanderName(entry?.name),
      score: Math.max(0, Number(entry?.score) || 0),
      updatedAt: Math.max(0, Number(entry?.updatedAt) || 0),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => (b.score - a.score) || (b.updatedAt - a.updatedAt))
    .slice(0, 5);

  saveCommanderLeaderboard(sorted, storage);
  return sorted;
}
