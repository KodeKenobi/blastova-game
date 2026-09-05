import {
  BASE_HEIGHT,
  BASE_WIDTH,
  BOARD_HEIGHT,
  BOARD_WIDTH,
  DEBUG_FLAGS,
} from './game-config-constants';
import { createBoardScalers } from './game-core-utils';
import { PLANE_ENEMY_VARIANTS } from './game-weapon-data';

const { sx, sy } = createBoardScalers({
  baseWidth: BASE_WIDTH,
  baseHeight: BASE_HEIGHT,
  boardWidth: BOARD_WIDTH,
  boardHeight: BOARD_HEIGHT,
});

const COMMANDER_COSTS = {
  soldier: 55,
  raider: 68,
  grenadier: 82,
  eliteSoldier: 100,
  humvee: 108,
  tank: 165,
  plane: 138,
};

const COMMANDER_COOLDOWNS_MS = {
  soldier: 180,
  raider: 260,
  grenadier: 540,
  eliteSoldier: 620,
  humvee: 680,
  tank: 980,
  plane: 760,
};

const COMMANDER_UNLOCK_LEVELS = {
  soldier: 1,
  raider: 1,
  grenadier: 1,
  eliteSoldier: 3,
  humvee: 1,
  tank: 1,
  plane: 1,
};

const COMMANDER_PLANE_BATCH_BASE = 3;
const COMMANDER_PLANE_BATCH_MAX = 7;
const COMMANDER_ROUTE_NEARBY_DISTANCE = 220;
const COMMANDER_ROUTE_ACTIVE_CAP_BY_TYPE = {
  soldier: 10,
  raider: 10,
  eliteSoldier: 8,
  grenadier: 7,
  humvee: 6,
  tank: 4,
  plane: 7,
};

const COMMANDER_GLOBAL_ACTIVE_CAP_BY_FAMILY = {
  infantry: 20,
  armored: 10,
  plane: 8,
};

const COMMANDER_QUEUE_CAP_BY_FAMILY = {
  infantry: 12,
  armored: 6,
  plane: 5,
};

const AUTO_SEED_DEFENDER_IN_ATTACK_MODE = true;
const ENABLE_OFFLINE_DEFENDER_AI_FALLBACK = true;
const DEFENDER_BOT_START_GOLD = 560;
const DEFENDER_BOT_WAVE1_START_GOLD = 760;
const VS_AI_ATTACK_DEFENDER_WAVE1_GOLD = 420;
const ATTACK_START_BOUNTY = 350;
const TESTING_ATTACK_START_BOUNTY = 1000;
const DEFENDER_BOT_GOLD_PER_KILL = 26;

const ONLINE_MATCHMAKING_ENABLED_STORAGE_KEY = 'blastova.onlineMatchmaking.enabled';
const ONLINE_MATCHMAKING_WS_URL_STORAGE_KEY = 'blastova.onlineMatchmaking.wsUrl';
const DEFAULT_ONLINE_MATCHMAKING_WS_URL = 'wss://blastova-matchmaker-production.up.railway.app';
const ONLINE_STATE_PUSH_INTERVAL_MS = 220;

const ENTRANCE_GLOW_POINTS = 24;
const ENTRANCE_GLOW_FLOW_STEP = 0.09;

const ENEMY_TRAY_UNITS = [
  {
    type: 'infantry',
    label: 'Infantry',
    batchCount: 8,
    assetPath: 'assets/soldier-sprites/craftpix-net-507107-free-soldier-sprite-sheets-pixel-art/Soldier_1/Attack.png',
  },
  {
    type: 'grenadier',
    label: 'Grenadier x4',
    batchCount: 4,
    assetPath: 'assets/soldier-sprites/craftpix-net-507107-free-soldier-sprite-sheets-pixel-art/Soldier_3/Grenade.png',
  },
  {
    type: 'humvee',
    label: 'Humvee x4',
    batchCount: 4,
    assetPath: 'assets/vehicles/humvee-top.png',
  },
  {
    type: 'tank',
    label: 'Tank x2',
    batchCount: 2,
    assetPath: 'assets/ground-shaker/ground_shaker_asset/Red/Bodies/body_halftrack.png',
  },
  {
    type: 'plane',
    label: 'Plane x3',
    batchCount: 3,
    assetPath: 'assets/planes/1.png',
  },
];

const ATTACK_BLUEPRINT_INFANTRY_SELECTION_STORAGE_KEY = 'blastova.attackBlueprint.selectedInfantry.v1';
const ATTACK_COMMANDER_PROGRESS_STORAGE_KEY = 'tdAttackCommanderV1';

const INFANTRY_TIER_VARIANTS = [
  {
    unlockLevel: 1,
    spawnType: 'soldier',
    label: 'Riflemen x8',
    batchCount: 8,
    assetPath: 'assets/soldier-sprites/craftpix-net-507107-free-soldier-sprite-sheets-pixel-art/Soldier_1/Attack.png',
    blueprintName: 'Soldier Squad',
  },
  {
    unlockLevel: 2,
    spawnType: 'raider',
    label: 'Raiders x6',
    batchCount: 6,
    assetPath: 'assets/soldier-sprites/craftpix-net-507107-free-soldier-sprite-sheets-pixel-art/Soldier_2/Attack.png',
    blueprintName: 'Raider Squad',
  },
  {
    unlockLevel: 3,
    spawnType: 'eliteSoldier',
    label: 'Elite x4',
    batchCount: 4,
    assetPath: 'assets/soldier-sprites/craftpix-net-507107-free-soldier-sprite-sheets-pixel-art/Soldier_3/Run.png',
    blueprintName: 'Elite Squad',
  },
];

function isOnlineMatchmakingEnabled() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return true;
    }
    const raw = String(window.localStorage.getItem(ONLINE_MATCHMAKING_ENABLED_STORAGE_KEY) || '').trim().toLowerCase();
    // Keep online matchmaking on by default; only an explicit developer opt-out disables it.
    if (!raw) return true;
    return raw !== 'force-off';
  } catch (_) {
    return true;
  }
}

function getOnlineMatchmakingWsUrl() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = String(window.localStorage.getItem(ONLINE_MATCHMAKING_WS_URL_STORAGE_KEY) || '').trim();
      if (saved) {
        return saved;
      }
    }
  } catch (_) {}
  return DEFAULT_ONLINE_MATCHMAKING_WS_URL;
}

function getFallbackAttackCommanderData() {
  return {
    level: 1,
    wins: 0,
    worldsCleared: [],
  };
}

function loadAttackCommanderData() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return getFallbackAttackCommanderData();
    }
    const raw = window.localStorage.getItem(ATTACK_COMMANDER_PROGRESS_STORAGE_KEY);
    if (!raw) return getFallbackAttackCommanderData();
    const parsed = JSON.parse(raw);
    return {
      level: Math.max(1, Number(parsed?.level) || 1),
      wins: Math.max(0, Number(parsed?.wins) || 0),
      worldsCleared: Array.isArray(parsed?.worldsCleared) ? parsed.worldsCleared.slice() : [],
    };
  } catch (_) {
    return getFallbackAttackCommanderData();
  }
}

function adoptPregameMatchSocket(scene) {
  try {
    if (typeof window === 'undefined') return false;
    const pregame = window.__tdPregameMultiplayer;
    if (!pregame || typeof pregame !== 'object') return false;

    const socket = pregame.socket;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      window.__tdPregameMultiplayer = null;
      return false;
    }

    const runtime = scene.multiplayerRuntime;
    runtime.online = {
      enabled: true,
      connected: true,
      queued: false,
      matched: true,
      socket,
      wsUrl: String(pregame.wsUrl || getOnlineMatchmakingWsUrl()),
      matchId: String(pregame.matchId || ''),
      peerId: String(pregame.peerId || ''),
      peerConnected: true,
      authoritativeRole: 'defender',
      lastStatePushAt: 0,
    };

    applyMatchedRole(scene, pregame.role);

    socket.onmessage = (event) => {
      let message = null;
      try {
        message = JSON.parse(String(event?.data || '{}'));
      } catch (_) {
        return;
      }
      handleOnlineMatchMessage(scene, message);
    };

    socket.onerror = () => {
      if (scene.multiplayerRuntime?.online?.socket !== socket) {
        return;
      }
      scene.setStatus('Online multiplayer link unstable. Falling back if peer disconnects.', '#ffb48f');
    };

    socket.onclose = () => {
      if (scene.multiplayerRuntime?.online?.socket !== socket) {
        return;
      }
      runtime.online.connected = false;
      runtime.online.queued = false;
      runtime.online.peerConnected = false;
      runtime.online.matched = false;
      scene.setStatus('Match connection closed. Local fallback active.', '#ffb48f');
    };

    window.__tdPregameMultiplayer = null;
    scene.setStatus('Match connected. Role assigned: ' + getRoleLabel(scene.multiplayerRuntime?.role) + '.', '#9edcff');
    return true;
  } catch (_) {
    return false;
  }
}

function closeOnlineMatchSocket(runtime) {
  const socket = runtime?.online?.socket || null;
  if (!socket) return;
  try {
    socket.onopen = null;
    socket.onclose = null;
    socket.onerror = null;
    socket.onmessage = null;
    if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
      socket.close(1000, 'scene-transition');
    }
  } catch (_) {}
}

function getCommanderPlayerLevel(scene) {
  if (scene && typeof scene.getEffectivePlayerLevel === 'function') {
    return Math.max(1, Number(scene.getEffectivePlayerLevel() || 1));
  }
  return Math.max(1, Number(scene?.gameState?.playerLevel || 1));
}

function getUnlockedCommanderInfantryVariants(scene) {
  const level = getCommanderPlayerLevel(scene);
  return INFANTRY_TIER_VARIANTS.filter((variant) => level >= Math.max(1, Number(variant.unlockLevel || 1)));
}

function getPreferredCommanderInfantryBlueprintName() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return '';
    return String(window.localStorage.getItem(ATTACK_BLUEPRINT_INFANTRY_SELECTION_STORAGE_KEY) || '').trim();
  } catch (_) {
    return '';
  }
}

function getCommanderInfantryVariant(scene) {
  const unlocked = getUnlockedCommanderInfantryVariants(scene);
  if (!unlocked.length) {
    return INFANTRY_TIER_VARIANTS[0];
  }

  const preferredBlueprintName = getPreferredCommanderInfantryBlueprintName();
  if (preferredBlueprintName) {
    const preferred = unlocked.find((variant) => variant.blueprintName === preferredBlueprintName);
    if (preferred) {
      return preferred;
    }
  }

  return unlocked[unlocked.length - 1];
}

function getRoleLabel(role) {
  return role === 'enemyCommander' ? 'Enemy Commander' : 'Defender';
}

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function toTimerText(ms) {
  const totalSec = Math.max(0, Math.ceil((Number(ms) || 0) / 1000));
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return mm + ':' + ss;
}

function getCommanderSpawnTypeLabel(spawnType) {
  if (spawnType === 'raider') return 'Raider';
  if (spawnType === 'humvee') return 'Humvee';
  if (spawnType === 'grenadier') return 'Grenadier';
  if (spawnType === 'eliteSoldier') return 'Elite';
  if (spawnType === 'tank') return 'Tank';
  if (spawnType === 'plane') return 'Plane';
  return 'Soldier';
}

function getCommanderSpawnUnlockLevel(spawnType) {
  return Math.max(1, Number(COMMANDER_UNLOCK_LEVELS[spawnType] || 1));
}

function isCommanderSpawnTypeUnlocked(scene, spawnType) {
  const level = getCommanderPlayerLevel(scene);
  return level >= getCommanderSpawnUnlockLevel(spawnType);
}

function getCommanderUnlockedPlaneBatchCount(scene) {
  const level = getCommanderPlayerLevel(scene);
  const unlockSteps = Math.max(0, level - 1);
  return Math.max(
    COMMANDER_PLANE_BATCH_BASE,
    Math.min(COMMANDER_PLANE_BATCH_MAX, COMMANDER_PLANE_BATCH_BASE + unlockSteps)
  );
}

function getCommanderPlaneVariantPool(scene) {
  const variantCount = Math.max(1, Math.min(
    PLANE_ENEMY_VARIANTS.length,
    getCommanderUnlockedPlaneBatchCount(scene)
  ));
  return PLANE_ENEMY_VARIANTS.slice(0, variantCount);
}

function getCommanderSpawnFamily(enemyType) {
  if (enemyType === 'plane') return 'plane';
  if (enemyType === 'tank' || enemyType === 'humvee') return 'armored';
  return 'infantry';
}

function matchesCommanderSpawnFamily(enemyType, family) {
  return getCommanderSpawnFamily(String(enemyType || 'soldier')) === family;
}

function getCommanderGlobalCrowdCount(scene, enemyType) {
  const family = getCommanderSpawnFamily(enemyType);
  const activeEnemies = scene.enemies?.children?.entries || [];

  const activeCount = activeEnemies.reduce((total, enemy) => {
    if (!enemy?.active || enemy.getData?.('isTestDummy')) return total;
    const activeType = String(enemy.getData?.('enemyType') || 'soldier');
    return total + (matchesCommanderSpawnFamily(activeType, family) ? 1 : 0);
  }, 0);

  const queuedCount = (scene.multiplayerRuntime?.spawnQueue || []).reduce((total, step) => {
    const queuedType = String(step?.enemyType || 'soldier');
    return total + (matchesCommanderSpawnFamily(queuedType, family) ? 1 : 0);
  }, 0);

  return activeCount + queuedCount;
}

function getCommanderQueuedFamilyCount(scene, enemyType) {
  const family = getCommanderSpawnFamily(enemyType);
  return (scene.multiplayerRuntime?.spawnQueue || []).reduce((total, step) => {
    const queuedType = String(step?.enemyType || 'soldier');
    return total + (matchesCommanderSpawnFamily(queuedType, family) ? 1 : 0);
  }, 0);
}

function getCommanderQueuedRouteFamilyCount(scene, enemyType, routeKey, lane) {
  const family = getCommanderSpawnFamily(enemyType);
  return (scene.multiplayerRuntime?.spawnQueue || []).reduce((total, step) => {
    const queuedType = String(step?.enemyType || 'soldier');
    if (!matchesCommanderSpawnFamily(queuedType, family)) return total;
    if (queuedType === 'plane' || enemyType === 'plane') {
      return queuedType === 'plane'
        && enemyType === 'plane'
        && String(step?.planeLane || 'middle') === String(lane || 'middle')
        ? total + 1
        : total;
    }
    return String(step?.forcedRouteKey || 'route1') === String(routeKey || 'route1')
      ? total + 1
      : total;
  }, 0);
}

function getCommanderLocalCrowdCount(scene, enemyType, routeKey, lane) {
  const activeEnemies = scene.enemies?.children?.entries || [];
  const routeThreshold = sx(COMMANDER_ROUTE_NEARBY_DISTANCE);
  const laneY = enemyType === 'plane' ? scene.getPlaneLaneWorldY?.(lane || 'middle') : null;

  const activeCount = activeEnemies.reduce((total, enemy) => {
    if (!enemy?.active) return total;
    const activeType = String(enemy.getData?.('enemyType') || 'soldier');
    const isPlane = !!enemy.getData?.('isPlane') || activeType === 'plane';
    if (enemyType === 'plane') {
      if (!isPlane) return total;
      const sameLane = String(enemy.getData?.('planeLane') || 'middle') === String(lane || 'middle');
      if (!sameLane) return total;
      const closeToLane = Number.isFinite(laneY)
        ? Math.abs((Number(enemy.y) || 0) - laneY) <= sy(120)
        : true;
      const stillNearDropZone = (Number(enemy.x) || 0) <= (BOARD_WIDTH * 0.72);
      return total + (closeToLane && stillNearDropZone ? 1 : 0);
    }

    if (isPlane) return total;
    const sameRoute = String(enemy.getData?.('routeKey') || '') === String(routeKey || '');
    if (!sameRoute) return total;
    const traveled = Number(scene.getEnemyPathDistance?.(enemy) || 0);
    return total + (traveled <= routeThreshold ? 1 : 0);
  }, 0);

  const queuedCount = (scene.multiplayerRuntime?.spawnQueue || []).reduce((total, step) => {
    const queuedType = String(step?.enemyType || 'soldier');
    if (enemyType === 'plane') {
      const samePlaneType = queuedType === 'plane';
      const sameLane = String(step?.planeLane || 'middle') === String(lane || 'middle');
      return total + (samePlaneType && sameLane ? 1 : 0);
    }
    const sameGroundType = queuedType !== 'plane';
    const sameRoute = String(step?.forcedRouteKey || '') === String(routeKey || '');
    return total + (sameGroundType && sameRoute ? 1 : 0);
  }, 0);

  return activeCount + queuedCount;
}

export function isMultiplayerModeEnabled() {
  return this.gameState?.selectedMode === 'multiplayer'
    || this.gameState?.selectedMode === 'vsAiAttack';
}

export function isMultiplayerEnemyCommanderRole() {
  return this.isMultiplayerModeEnabled() && this.gameState?.multiplayerRole === 'enemyCommander';
}

export function isEnemyCommanderRole() {
  const mode = this.gameState?.selectedMode;
  return (mode === 'multiplayer' || mode === 'vsAiAttack')
    && this.gameState?.multiplayerRole === 'enemyCommander';
}

function sendOnlineMatchMessage(scene, payload = {}) {
  const runtime = scene.multiplayerRuntime;
  const socket = runtime?.online?.socket;
  if (!socket || socket.readyState !== WebSocket.OPEN) return false;
  try {
    socket.send(JSON.stringify(payload));
    return true;
  } catch (_) {
    return false;
  }
}

function applyMatchedRole(scene, role) {
  const normalizedRole = role === 'enemyCommander' ? 'enemyCommander' : 'defender';
  scene.gameState.multiplayerRole = normalizedRole;
  if (scene.multiplayerRuntime) {
    scene.multiplayerRuntime.role = normalizedRole;
  }
  scene.syncMultiplayerCommanderVisibility?.();
  scene.updateMultiplayerCommanderHud?.(true);
}

function handleOnlineMatchMessage(scene, message) {
  const runtime = scene.multiplayerRuntime;
  if (!runtime?.online || !message || typeof message !== 'object') {
    return;
  }

  if (message.type === 'queued') {
    runtime.online.queued = true;
    scene.setStatus('Matchmaking: searching for a live opponent...', '#9edcff');
    return;
  }

  if (message.type === 'matched') {
    runtime.online.matched = true;
    runtime.online.matchId = String(message.matchId || '');
    runtime.online.peerId = String(message.peerId || '');
    runtime.online.authoritativeRole = String(message.authoritativeRole || 'defender');
    applyMatchedRole(scene, message.role);
    scene.setStatus('Match found. Role assigned: ' + getRoleLabel(scene.multiplayerRuntime?.role) + '.', '#9edcff');
    return;
  }

  if (message.type === 'wave_start') {
    if (scene.gameState?.prepPhase && !scene.gameState?.gameOver) {
      scene.startMultiplayerWave?.();
      scene.cancelWaveCountdown?.();
      scene.toggleBlueprintOverlay?.(false);
      scene.gameState.prepPhase = false;
      scene.updatePauseHudButton?.();
      scene.playBattleThemeMusic?.();
    }
    return;
  }

  if (message.type === 'commander_spawn') {
    const step = message.step || {};
    scene.tryCommanderSpawn?.(String(step.enemyType || 'soldier'), {
      remoteCommand: true,
      skipCost: true,
      ignoreCooldown: true,
      forcedRouteKey: step.forcedRouteKey,
      planeLane: step.planeLane,
      planeDirection: step.planeDirection,
      planeVariantId: step.planeVariantId,
      spawnAtEntrance: !!step.spawnAtEntrance,
      spawnOriginX: Number.isFinite(Number(step.spawnOriginX)) ? Number(step.spawnOriginX) : null,
      spawnOriginY: Number.isFinite(Number(step.spawnOriginY)) ? Number(step.spawnOriginY) : null,
      delayAfter: Number(step.delayAfter) || undefined,
      minGapFromPrev: Number(step.minGapFromPrev) || undefined,
    });
    return;
  }

  if (message.type === 'state_update') {
    if (scene.isMultiplayerEnemyCommanderRole?.()) {
      const lives = Number(message.lives);
      if (Number.isFinite(lives)) {
        scene.gameState.lives = Math.max(0, Math.floor(lives));
      }
      const wave = Number(message.wave);
      if (Number.isFinite(wave)) {
        scene.gameState.wave = Math.max(1, Math.floor(wave));
      }
      scene.updateHud?.();
    }
    return;
  }

  if (message.type === 'peer_disconnected') {
    runtime.online.matched = false;
    runtime.online.peerConnected = false;
    scene.setStatus('Opponent disconnected. Returning to offline fallback behavior.', '#ffb48f');
    return;
  }
}

function startOnlineMatchmaking(scene) {
  const runtime = scene.multiplayerRuntime;
  if (!runtime || !scene.isMultiplayerModeEnabled?.()) {
    return;
  }

  if (adoptPregameMatchSocket(scene)) {
    return;
  }

  closeOnlineMatchSocket(runtime);

  if (!isOnlineMatchmakingEnabled()) {
    runtime.online = {
      enabled: false,
      connected: false,
      queued: false,
      matched: false,
      socket: null,
      matchId: '',
      peerId: '',
      peerConnected: false,
      authoritativeRole: 'defender',
      lastStatePushAt: 0,
    };
    return;
  }

  const wsUrl = getOnlineMatchmakingWsUrl();
  let socket = null;
  try {
    socket = new WebSocket(wsUrl);
  } catch (_) {
    scene.setStatus('Online matchmaking unavailable. Using local multiplayer fallback.', '#ffb48f');
    return;
  }

  runtime.online = {
    enabled: true,
    connected: false,
    queued: false,
    matched: false,
    socket,
    wsUrl,
    matchId: '',
    peerId: '',
    peerConnected: false,
    authoritativeRole: 'defender',
    lastStatePushAt: 0,
  };

  socket.onopen = () => {
    if (!scene.multiplayerRuntime?.online || scene.multiplayerRuntime.online.socket !== socket) {
      return;
    }
    runtime.online.connected = true;
    scene.setStatus('Connected to online matchmaking. Joining queue...', '#9edcff');
    sendOnlineMatchMessage(scene, {
      type: 'queue_join',
      game: 'blastova',
      rolePreference: scene.gameState?.multiplayerRole === 'enemyCommander' ? 'enemyCommander' : 'defender',
      world: Number(scene.gameState?.selectedWorldIndex || 0),
      difficulty: String(scene.gameState?.selectedDifficulty || 'normal'),
      playerLevel: Number(scene.gameState?.playerLevel || 1),
      timestamp: Date.now(),
    });
  };

  socket.onmessage = (event) => {
    let message = null;
    try {
      message = JSON.parse(String(event?.data || '{}'));
    } catch (_) {
      return;
    }
    handleOnlineMatchMessage(scene, message);
  };

  socket.onerror = () => {
    if (scene.multiplayerRuntime?.online?.socket !== socket) {
      return;
    }
    scene.setStatus('Online matchmaking unavailable. Using local multiplayer fallback.', '#ffb48f');
  };

  socket.onclose = () => {
    if (scene.multiplayerRuntime?.online?.socket !== socket) {
      return;
    }
    if (scene.isMultiplayerModeEnabled?.()) {
      runtime.online.connected = false;
      runtime.online.queued = false;
      runtime.online.peerConnected = false;
      scene.setStatus('Matchmaking disconnected. Local multiplayer fallback active.', '#ffb48f');
    }
  };
}

export function canLocalPlayerBuildTowers() {
  if (!this.isMultiplayerModeEnabled()) {
    return true;
  }
  return !this.isMultiplayerEnemyCommanderRole();
}

export function initializeMultiplayerMode() {
  if (!this.isMultiplayerModeEnabled()) {
    closeOnlineMatchSocket(this.multiplayerRuntime);
    this.multiplayerRuntime = {
      enabled: false,
      role: 'defender',
      waveActive: false,
      waveEndsAt: 0,
      spawnQueue: [],
      enemyCountSnapshot: 0,
      clearPending: false,
      threat: 0,
      threatMax: 0,
      threatRegenPerSec: 0,
      selectedRouteKey: 'route1',
      selectedPlaneLane: 'middle',
      cooldownByType: {},
      lastTickAt: 0,
      botNextActionAt: 0,
      botBurstDebt: 0,
      defenderBotSeeded: false,
      defenderBotNextPlaceAt: 0,
      defenderBotPlacedThisWave: 0,
      defenderBotGold: DEFENDER_BOT_START_GOLD,
      defenderBotLastKillCount: 0,
      defenderBotTowerUsage: {},
      defenderBotTowerLearn: {},
      defenderBotLastPlacedKey: null,
      defenderBotPlacementHistory: [],
      defenderBotLastEnemyDefeated: 0,
      allowDefenderBypass: false,
      online: {
        enabled: false,
        connected: false,
        queued: false,
        matched: false,
        socket: null,
        matchId: '',
        peerId: '',
        peerConnected: false,
        authoritativeRole: 'defender',
        lastStatePushAt: 0,
      },
    };
    this.teardownMultiplayerCommanderOverlay?.();
    this.clearEnemySpawnEntrances?.();
    if (typeof window !== 'undefined' && typeof window.__setHtmlTrayMode === 'function') {
      window.__setHtmlTrayMode('weapon');
    }
    return;
  }

  const role = this.gameState?.multiplayerRole === 'enemyCommander' ? 'enemyCommander' : 'defender';
  const multiplayerVariant = this.gameState?.multiplayerVariant === 'ai' ? 'ai' : 'online';
  const isVsAiVariant = multiplayerVariant === 'ai';
  if (role === 'enemyCommander') {
    const attackCommanderData = loadAttackCommanderData();
    this.gameState.playerLevel = Math.max(1, Number(attackCommanderData.level || 1));
  }
  const startingBounty = this.gameState?.selectedMode === 'vsAiAttack' && DEBUG_FLAGS.extraGoldForTesting
    ? TESTING_ATTACK_START_BOUNTY
    : Math.max(0, Number(ATTACK_START_BOUNTY || 350));
  this.multiplayerRuntime = {
    enabled: true,
    role,
    waveActive: false,
    waveEndsAt: 0,
    spawnQueue: [],
    enemyCountSnapshot: 0,
    clearPending: false,
    threat: startingBounty,
    threatMax: Math.max(startingBounty, 120),
    threatRegenPerSec: 0,
    selectedRouteKey: this.multiplayerRuntime?.selectedRouteKey || 'route1',
    selectedPlaneLane: this.multiplayerRuntime?.selectedPlaneLane || 'middle',
    cooldownByType: {
      soldier: 0,
      raider: 0,
      grenadier: 0,
      eliteSoldier: 0,
      humvee: 0,
      tank: 0,
      plane: 0,
    },
    lastTickAt: this.time?.now || 0,
    botNextActionAt: 0,
    botBurstDebt: 0,
    defenderBotSeeded: false,
    defenderBotNextPlaceAt: 0,
    defenderBotPlacedThisWave: 0,
    defenderBotGold: DEFENDER_BOT_START_GOLD,
    defenderBotLastKillCount: 0,
    defenderBotTowerUsage: {},
    defenderBotTowerLearn: {},
    defenderBotLastPlacedKey: null,
    defenderBotPlacementHistory: [],
    defenderBotLastEnemyDefeated: 0,
    allowDefenderBypass: false,
    online: {
      enabled: false,
      connected: false,
      queued: false,
      matched: false,
      socket: null,
      wsUrl: '',
      matchId: '',
      peerId: '',
      peerConnected: false,
      authoritativeRole: 'defender',
      lastStatePushAt: 0,
    },
  };

  this.setupMultiplayerCommanderOverlay?.();
  this.syncMultiplayerCommanderVisibility?.();
  this.updateMultiplayerCommanderHud?.(true);
  if (typeof window !== 'undefined' && typeof window.__setHtmlTrayMode === 'function') {
    window.__setHtmlTrayMode(role === 'enemyCommander' ? 'enemy' : 'weapon');
  }
  if (role === 'enemyCommander') {
    if (AUTO_SEED_DEFENDER_IN_ATTACK_MODE) {
      this.seedDefenderBotLoadout?.();
    }
    this.setupEnemySpawnEntrances?.();
    this.pushEnemyTrayCardsToHtml?.(true);
  } else {
    this.clearEnemySpawnEntrances?.();
  }

  if (role === 'enemyCommander') {
    this.setStatus(
      isVsAiVariant
        ? 'VS AI active. You are Enemy Commander. Breach the core by draining all defender lives.'
        : 'Multiplayer active. You are Enemy Commander. Breach the core by draining all defender lives.',
      '#9edcff'
    );
  } else {
    this.setStatus(
      isVsAiVariant
        ? 'VS AI active. You are Defender. Enemy commander bot will attack each wave.'
        : 'Multiplayer active. You are Defender. Enemy commander bot will attack each wave.',
      '#9edcff'
    );
  }

  if (!isVsAiVariant) {
    startOnlineMatchmaking(this);
  }
}

export function startMultiplayerWave() {
  if (!this.isMultiplayerModeEnabled()) {
    return false;
  }

  if (this.gameState) {
    this.gameState.attackEndReason = '';
  }

  const runtime = this.multiplayerRuntime || {};
  const wave = Math.max(1, Number(this.gameState?.wave || 1));
  const waveDurationMs = Math.min(130000, 60000 + (wave * 7000));

  runtime.enabled = true;
  runtime.waveActive = true;
  runtime.clearPending = false;
  runtime.waveStartedAt = this.time?.now || 0;
  runtime.waveDurationMs = waveDurationMs;
  runtime.waveEndsAt = runtime.waveStartedAt + waveDurationMs;
  runtime.spawnQueue = [];
  runtime.lastTickAt = this.time?.now || 0;
  runtime.botNextActionAt = this.time?.now || 0;
  runtime.botBurstDebt = 0;
  runtime.defenderBotNextPlaceAt = this.time?.now || 0;
  runtime.defenderBotPlacedThisWave = 0;
  runtime.defenderBotTowerUsage = {};
  runtime.defenderBotPlacementHistory = [];
  runtime.defenderBotLastPlacedKey = null;
  if (wave === 1 || !Number.isFinite(runtime.defenderBotGold)) {
    runtime.defenderBotGold = wave === 1
      ? (this.gameState?.selectedMode === 'vsAiAttack' ? VS_AI_ATTACK_DEFENDER_WAVE1_GOLD : DEFENDER_BOT_WAVE1_START_GOLD)
      : DEFENDER_BOT_START_GOLD;
  }
  runtime.threatMax = Math.max(ATTACK_START_BOUNTY, Math.min(420, 180 + (wave * 20)));
  runtime.threatRegenPerSec = 0;
  const minOpenCost = COMMANDER_COSTS.soldier || 0;
  const preservedThreat = Math.max(0, Number(runtime.threat || 0));
  runtime.threat = Math.min(runtime.threatMax, Math.max(preservedThreat, minOpenCost));
  runtime.enemyCountSnapshot = 0;

  this.multiplayerRuntime = runtime;

  this.enemyCount = 0;
  this.enemiesSpawned = 0;
  this.enemiesResolved = 0;
  this.enemiesDefeated = 0;
  runtime.defenderBotLastEnemyDefeated = 0;
  runtime.defenderBotLastKillCount = 0;
  this.waveLeaksThisWave = 0;
  this.waveDamageDealt = 0;
  this.waveSuppliesEarned = 0;
  this.waveStartedAtMs = this.time?.now || 0;
  this.nextEnemyTime = (this.time?.now || 0) + 280;

  if (this.isMultiplayerEnemyCommanderRole()) {
    if (AUTO_SEED_DEFENDER_IN_ATTACK_MODE) {
      this.seedDefenderBotLoadout?.();
    }
    this.setupEnemySpawnEntrances?.();
    this.pushEnemyTrayCardsToHtml?.(true);
    this.setStatus('Wave ' + wave + ' started. Spend bounty to deploy enemy squads and drain defender lives to 0.', '#9edcff');
  } else {
    const onlineMatched = !!runtime.online?.matched;
    this.setStatus(
      onlineMatched
        ? ('Wave ' + wave + ' started. Live enemy commander is issuing attacks.')
        : ('Wave ' + wave + ' started. Enemy commander bot is issuing attacks.'),
      '#9edcff'
    );
  }

  const online = runtime.online || null;
  if (online?.matched && this.isMultiplayerEnemyCommanderRole()) {
    sendOnlineMatchMessage(this, {
      type: 'wave_start',
      matchId: online.matchId || '',
      wave,
      timestamp: Date.now(),
    });
  }

  this.updateMultiplayerCommanderHud?.(true);
  return true;
}

export function getCommanderRouteOptions() {
  if (Array.isArray(this.customSpawnRoutes) && this.customSpawnRoutes.length > 0) {
    return this.customSpawnRoutes.map((route, index) => ({
      key: route?.key || ('route' + String(index + 1)),
      label: route?.label || ('Route ' + String(index + 1)),
    }));
  }

  const routes = [{ key: 'route1', label: 'Main' }];
  if (this.secondaryPath) routes.push({ key: 'route2', label: 'Route 2' });
  if (this.tertiaryPath) routes.push({ key: 'route3', label: 'Route 3' });
  if (this.quaternaryPath) routes.push({ key: 'route4', label: 'Route 4' });
  return routes;
}

export function setCommanderRouteKey(routeKey) {
  if (!this.multiplayerRuntime) {
    return;
  }

  const options = this.getCommanderRouteOptions();
  const valid = options.some((entry) => entry.key === routeKey);
  if (!valid) {
    return;
  }

  this.multiplayerRuntime.selectedRouteKey = routeKey;
  this.updateMultiplayerCommanderHud?.(true);
}

export function setCommanderPlaneLane(laneKey) {
  if (!this.multiplayerRuntime) {
    return;
  }
  const lane = laneKey === 'top' || laneKey === 'bottom' ? laneKey : 'middle';
  this.multiplayerRuntime.selectedPlaneLane = lane;
  this.updateMultiplayerCommanderHud?.(true);
}

export function tryCommanderSpawn(enemyType, options = {}) {
  if (!this.isMultiplayerModeEnabled() || this.gameState?.gameOver) {
    return false;
  }

  const remoteCommand = !!options.remoteCommand;

  const autoStartAttackWave = (this.isMultiplayerEnemyCommanderRole() || remoteCommand) && this.gameState?.prepPhase;
  if (autoStartAttackWave) {
    const started = this.startMultiplayerWave?.();
    if (!started) {
      return false;
    }
    this.cancelWaveCountdown?.();
    this.toggleBlueprintOverlay?.(false);
    this.gameState.prepPhase = false;
    if (this.weaponReachGlowLayer) {
      this.weaponReachGlowLayer.setVisible(false);
    }
    this.updatePauseHudButton?.();
    this.playBattleThemeMusic?.();
  } else if (this.gameState?.prepPhase && !remoteCommand) {
    return false;
  }

  const runtime = this.multiplayerRuntime;
  if (!runtime?.waveActive) {
    return false;
  }

  const spawnFamily = getCommanderSpawnFamily(enemyType);
  const queuedFamilyCount = getCommanderQueuedRouteFamilyCount(
    this,
    enemyType,
    options.forcedRouteKey || 'route1',
    options.planeLane || 'middle',
  );
  const queueCapForFamily = Number(COMMANDER_QUEUE_CAP_BY_FAMILY[spawnFamily] || 0);
  if (queueCapForFamily > 0 && queuedFamilyCount >= queueCapForFamily) {
    if (!remoteCommand && !options.silent) {
      this.setStatus('Too many ' + spawnFamily + ' units queued. Wait for deployment.', '#ffcf8a');
    }
    return false;
  }
  const globalCapForFamily = Number(COMMANDER_GLOBAL_ACTIVE_CAP_BY_FAMILY[spawnFamily] || 0);
  const currentFamilyCrowd = getCommanderGlobalCrowdCount(this, enemyType);
  if (globalCapForFamily > 0 && currentFamilyCrowd >= globalCapForFamily) {
    if (!remoteCommand && !options.silent) {
      this.setStatus('Too many ' + spawnFamily + ' units active right now. Wait for the push to spread out.', '#ffcf8a');
    }
    return false;
  }

  const cost = COMMANDER_COSTS[enemyType] || 0;
  if (cost <= 0) {
    return false;
  }

  if (!remoteCommand && !isCommanderSpawnTypeUnlocked(this, enemyType)) {
    const neededLevel = getCommanderSpawnUnlockLevel(enemyType);
    if (!options.silent) {
      this.setStatus(getCommanderSpawnTypeLabel(enemyType) + ' unlocks at Level ' + neededLevel + '.', '#ffcf8c');
    }
    return false;
  }

  const skipCost = remoteCommand || !!options.skipCost;

  const now = this.time?.now || 0;
  const cooldownAt = runtime.cooldownByType?.[enemyType] || 0;
  if (!remoteCommand && !options.ignoreCooldown && cooldownAt > now) {
    return false;
  }

  if (!skipCost && (runtime.threat || 0) < cost) {
    if (!options.silent) {
      this.setStatus('Insufficient bounty for ' + enemyType + '.', '#ffb48f');
    }
    return false;
  }

  const routeOptions = this.getCommanderRouteOptions();
  const fallbackRouteKey = routeOptions[0]?.key || 'route1';
  const forcedRouteKey = options.forcedRouteKey || runtime.selectedRouteKey || fallbackRouteKey;
  const planeLane = options.planeLane || runtime.selectedPlaneLane || 'middle';
  const planeDirection = options.planeDirection === 'west' ? 'west' : 'east';
  const spawnOriginX = Number(options.spawnOriginX);
  const spawnOriginY = Number(options.spawnOriginY);
  const hasSpawnOrigin = Number.isFinite(spawnOriginX) && Number.isFinite(spawnOriginY);

  const spawnStep = {
    enemyType,
    forcedRouteKey,
    planeLane,
    planeDirection,
    spawnAtEntrance: !!options.spawnAtEntrance,
    spawnOriginX: hasSpawnOrigin ? spawnOriginX : null,
    spawnOriginY: hasSpawnOrigin ? spawnOriginY : null,
    delayAfter: options.delayAfter || (enemyType === 'tank' ? 110 : enemyType === 'plane' ? 180 : 120),
    minGapFromPrev: options.minGapFromPrev || (enemyType === 'tank' ? sx(70) : sx(28)),
  };

  if (enemyType === 'plane') {
    const variantPool = getCommanderPlaneVariantPool(this);
    const explicitVariantId = typeof options.planeVariantId === 'string' ? options.planeVariantId : '';
    let resolvedVariantId = explicitVariantId;
    if (!resolvedVariantId) {
      const cursor = Math.max(0, Number(runtime.commanderPlaneVariantCursor || 0));
      const fallback = variantPool[cursor % variantPool.length] || PLANE_ENEMY_VARIANTS[0];
      resolvedVariantId = fallback?.id || '';
      runtime.commanderPlaneVariantCursor = cursor + 1;
    }
    if (resolvedVariantId) {
      spawnStep.planeVariantId = resolvedVariantId;
    }
  }

  runtime.spawnQueue.push(spawnStep);
  if (!skipCost) {
    runtime.threat = Math.max(0, (runtime.threat || 0) - cost);
  }
  if (!remoteCommand && !options.ignoreCooldown) {
    runtime.cooldownByType[enemyType] = now + (COMMANDER_COOLDOWNS_MS[enemyType] || 400);
  }

  const online = runtime.online || null;
  if (!remoteCommand && online?.matched && this.isMultiplayerEnemyCommanderRole()) {
    sendOnlineMatchMessage(this, {
      type: 'commander_spawn',
      matchId: online.matchId || '',
      step: {
        enemyType,
        forcedRouteKey,
        planeLane,
        planeDirection,
        planeVariantId: spawnStep.planeVariantId || '',
        spawnAtEntrance: !!spawnStep.spawnAtEntrance,
        spawnOriginX: Number.isFinite(Number(spawnStep.spawnOriginX)) ? Number(spawnStep.spawnOriginX) : null,
        spawnOriginY: Number.isFinite(Number(spawnStep.spawnOriginY)) ? Number(spawnStep.spawnOriginY) : null,
        delayAfter: Number(spawnStep.delayAfter) || 120,
        minGapFromPrev: Number(spawnStep.minGapFromPrev) || 0,
      },
      timestamp: Date.now(),
    });
  }

  this.updateMultiplayerCommanderHud?.(true);
  return true;
}

export function getEnemyTrayUnitCatalog() {
  return ENEMY_TRAY_UNITS.slice();
}

export function shiftEnemyTrayCarousel(direction = 1) {
  if (!this.isMultiplayerEnemyCommanderRole()) {
    return;
  }

  const runtime = this.multiplayerRuntime || {};
  const units = ENEMY_TRAY_UNITS;
  if (!units.length) {
    return;
  }

  const next = (Number(runtime.enemyTrayIndex) || 0) + (direction >= 0 ? 1 : -1);
  const total = units.length;
  runtime.enemyTrayIndex = ((next % total) + total) % total;
  this.multiplayerRuntime = runtime;
  this.pushEnemyTrayCardsToHtml?.(true);
}

export function getEnemyTrayCards() {
  const units = ENEMY_TRAY_UNITS;
  if (!units.length) {
    return [];
  }

  const runtime = this.multiplayerRuntime || {};
  const total = units.length;
  const centerIndex = ((Number(runtime.enemyTrayIndex) || 0) % total + total) % total;
  const ordered = [
    units[(centerIndex - 1 + total) % total],
    units[centerIndex],
    units[(centerIndex + 1) % total],
  ];

  return ordered.map((unit, idx) => {
    const isInfantryCard = unit.type === 'infantry';
    const isPlaneCard = unit.type === 'plane';
    const infantryVariant = isInfantryCard ? getCommanderInfantryVariant(this) : null;
    const resolvedEnemyType = isInfantryCard ? infantryVariant.spawnType : unit.type;
    const planeBatchCount = isPlaneCard ? getCommanderUnlockedPlaneBatchCount(this) : 0;
    const resolvedBatchCount = isInfantryCard
      ? infantryVariant.batchCount
      : (isPlaneCard ? planeBatchCount : unit.batchCount);
    const resolvedLabel = isInfantryCard
      ? infantryVariant.label
      : (isPlaneCard ? ('Plane x' + String(resolvedBatchCount)) : unit.label);
    const resolvedAssetPath = isInfantryCard ? infantryVariant.assetPath : unit.assetPath;
    const threatCost = COMMANDER_COSTS[resolvedEnemyType] || 0;
    return {
      label: resolvedLabel,
      assetPath: resolvedAssetPath,
      enemyDefRef: {
        enemyType: resolvedEnemyType,
        batchCount: resolvedBatchCount,
        threatCost,
        label: resolvedLabel,
        assetPath: resolvedAssetPath,
      },
      isCenter: idx === 1,
      locked: false,
    };
  });
}

export function pushEnemyTrayCardsToHtml(force = false) {
  if (!this.isMultiplayerEnemyCommanderRole()) {
    return;
  }
  if (typeof window === 'undefined' || typeof window.__updateHtmlEnemyCards !== 'function') {
    return;
  }
  const cards = this.getEnemyTrayCards();
  window.__updateHtmlEnemyCards(cards, !!force);
}

export function getEnemySpawnLaneForWorldY(worldY = 0) {
  const topLaneY = this.getPlaneLaneWorldY?.('top') || (BOARD_HEIGHT * 0.3);
  const middleLaneY = this.getPlaneLaneWorldY?.('middle') || (BOARD_HEIGHT * 0.5);
  const bottomLaneY = this.getPlaneLaneWorldY?.('bottom') || (BOARD_HEIGHT * 0.7);
  const dTop = Math.abs(worldY - topLaneY);
  const dMiddle = Math.abs(worldY - middleLaneY);
  const dBottom = Math.abs(worldY - bottomLaneY);
  if (dTop <= dMiddle && dTop <= dBottom) return 'top';
  if (dBottom <= dMiddle && dBottom <= dTop) return 'bottom';
  return 'middle';
}

export function buildEnemySpawnRouteEntries() {
  const entries = [];

  if (Array.isArray(this.customSpawnRoutes) && this.customSpawnRoutes.length > 0) {
    this.customSpawnRoutes.forEach((route, index) => {
      const firstPoint = Array.isArray(route?.path) ? route.path[0] : null;
      if (!firstPoint) {
        return;
      }
      entries.push({
        key: route?.key || ('route' + String(index + 1)),
        label: route?.label || ('Route ' + String(index + 1)),
        x: firstPoint.x,
        y: firstPoint.y,
        path: route.path,
      });
    });
    return entries;
  }

  if (Array.isArray(this.path) && this.path[0]) {
    entries.push({ key: 'route1', label: 'Main', x: this.path[0].x, y: this.path[0].y, path: this.path });
  }
  if (Array.isArray(this.secondaryPath) && this.secondaryPath[0]) {
    entries.push({ key: 'route2', label: 'Route 2', x: this.secondaryPath[0].x, y: this.secondaryPath[0].y, path: this.secondaryPath });
  }
  if (Array.isArray(this.tertiaryPath) && this.tertiaryPath[0]) {
    entries.push({ key: 'route3', label: 'Route 3', x: this.tertiaryPath[0].x, y: this.tertiaryPath[0].y, path: this.tertiaryPath });
  }
  if (Array.isArray(this.quaternaryPath) && this.quaternaryPath[0]) {
    entries.push({ key: 'route4', label: 'Route 4', x: this.quaternaryPath[0].x, y: this.quaternaryPath[0].y, path: this.quaternaryPath });
  }

  return entries;
}

function buildLeadGuidePoints(routePath) {
  const source = Array.isArray(routePath)
    ? routePath.slice(0, Math.min(routePath.length, ENTRANCE_GLOW_POINTS))
    : [];
  const points = simplifyGuidePolyline(source, sx(10));
  if (points.length < 2) {
    return null;
  }

  const segments = [];
  let totalLen = 0;
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (len <= 0.001) {
      continue;
    }
    segments.push({ a, b, len, totalBefore: totalLen });
    totalLen += len;
  }
  if (!segments.length || totalLen <= 0.001) {
    return null;
  }

  const sampleCount = Math.max(14, Math.min(32, Math.floor(totalLen / sx(16))));
  const sampled = [];
  for (let i = 0; i <= sampleCount; i += 1) {
    const d = (totalLen * i) / sampleCount;
    let seg = segments[segments.length - 1];
    for (let j = 0; j < segments.length; j += 1) {
      const candidate = segments[j];
      if (d <= candidate.totalBefore + candidate.len) {
        seg = candidate;
        break;
      }
    }
    const t = seg.len > 0 ? Math.max(0, Math.min(1, (d - seg.totalBefore) / seg.len)) : 0;
    sampled.push({
      x: seg.a.x + ((seg.b.x - seg.a.x) * t),
      y: seg.a.y + ((seg.b.y - seg.a.y) * t),
      t: i / sampleCount,
    });
  }

  return sampled;
}

function simplifyGuidePolyline(points, tolerance = 8) {
  if (!Array.isArray(points) || points.length <= 2) {
    return Array.isArray(points) ? points.slice() : [];
  }

  const sqTol = tolerance * tolerance;

  const sqDistToSegment = (p, a, b) => {
    const vx = b.x - a.x;
    const vy = b.y - a.y;
    const wx = p.x - a.x;
    const wy = p.y - a.y;
    const lenSq = (vx * vx) + (vy * vy);
    if (lenSq <= 0.0001) {
      const dx = p.x - a.x;
      const dy = p.y - a.y;
      return (dx * dx) + (dy * dy);
    }
    let t = ((wx * vx) + (wy * vy)) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const px = a.x + (vx * t);
    const py = a.y + (vy * t);
    const dx = p.x - px;
    const dy = p.y - py;
    return (dx * dx) + (dy * dy);
  };

  const kept = new Array(points.length).fill(false);
  kept[0] = true;
  kept[points.length - 1] = true;

  const simplifySegment = (startIdx, endIdx) => {
    if (endIdx - startIdx <= 1) {
      return;
    }
    let maxSqDist = 0;
    let maxIdx = -1;
    const a = points[startIdx];
    const b = points[endIdx];
    for (let i = startIdx + 1; i < endIdx; i += 1) {
      const sqd = sqDistToSegment(points[i], a, b);
      if (sqd > maxSqDist) {
        maxSqDist = sqd;
        maxIdx = i;
      }
    }
    if (maxIdx !== -1 && maxSqDist > sqTol) {
      kept[maxIdx] = true;
      simplifySegment(startIdx, maxIdx);
      simplifySegment(maxIdx, endIdx);
    }
  };

  simplifySegment(0, points.length - 1);

  const out = [];
  for (let i = 0; i < points.length; i += 1) {
    if (kept[i]) {
      out.push(points[i]);
    }
  }
  return out.length >= 2 ? out : points.slice();
}

function sampleGuidePoint(sampled, t) {
  if (!Array.isArray(sampled) || sampled.length === 0) {
    return null;
  }
  const clamped = Math.max(0, Math.min(1, Number(t) || 0));
  const scaled = clamped * (sampled.length - 1);
  const i0 = Math.floor(scaled);
  const i1 = Math.min(sampled.length - 1, i0 + 1);
  const frac = scaled - i0;
  const a = sampled[i0];
  const b = sampled[i1];
  return {
    x: a.x + ((b.x - a.x) * frac),
    y: a.y + ((b.y - a.y) * frac),
  };
}

function smoothGuidePoints(points, passes = 2) {
  if (!Array.isArray(points) || points.length < 4) {
    return Array.isArray(points) ? points.slice() : [];
  }

  let working = points.slice();
  for (let pass = 0; pass < passes; pass += 1) {
    const next = [working[0]];
    for (let i = 0; i < working.length - 1; i += 1) {
      const p0 = working[i];
      const p1 = working[i + 1];
      next.push({ x: (0.75 * p0.x) + (0.25 * p1.x), y: (0.75 * p0.y) + (0.25 * p1.y), t: p0.t });
      next.push({ x: (0.25 * p0.x) + (0.75 * p1.x), y: (0.25 * p0.y) + (0.75 * p1.y), t: p1.t });
    }
    next.push(working[working.length - 1]);
    working = next;
  }

  const total = Math.max(1, working.length - 1);
  return working.map((point, index) => ({ x: point.x, y: point.y, t: index / total }));
}

function getPlayableWorldBounds(scene) {
  const markerPadX = sx(24);
  const markerPadY = sy(16);
  const bounds = {
    left: markerPadX,
    right: BOARD_WIDTH - markerPadX,
    top: Math.max(sy(52), markerPadY),
    bottom: BOARD_HEIGHT - Math.max(sy(58), markerPadY),
  };

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return bounds;
  }

  const canvas = scene?.game?.canvas || null;
  const cam = scene?.cameras?.main || null;
  if (!canvas || !cam || !canvas.getBoundingClientRect) {
    return bounds;
  }

  const canvasRect = canvas.getBoundingClientRect();
  if (!canvasRect || canvasRect.height <= 0) {
    return bounds;
  }

  const hudRoot = document.getElementById('ab-hud-overlay');
  const hudBand = hudRoot?.querySelector?.('.hud') || hudRoot;
  const trayBand = document.getElementById('ht-weapon-tray')
    || document.querySelector('[data-weapon-tray-root="true"] #ht-weapon-tray')
    || document.querySelector('[data-weapon-tray-root="true"]');
  const hudRect = hudBand && hudBand.getBoundingClientRect ? hudBand.getBoundingClientRect() : null;
  const trayRect = trayBand && trayBand.getBoundingClientRect ? trayBand.getBoundingClientRect() : null;

  const zoom = cam.zoom || 1;
  const visibleWorldHeight = canvas.height / Math.max(0.0001, zoom);
  const visibleWorldWidth = canvas.width / Math.max(0.0001, zoom);
  const worldTop = cam.scrollY;
  const worldBottom = worldTop + visibleWorldHeight;
  const worldLeft = cam.scrollX;
  const worldRight = worldLeft + visibleWorldWidth;

  const hudBottomPx = hudRect
    ? Math.max(0, Math.min(canvasRect.height, hudRect.bottom - canvasRect.top))
    : 0;
  const trayTopPx = trayRect
    ? Math.max(0, Math.min(canvasRect.height, canvasRect.bottom - trayRect.top))
    : 0;
  const hudWorld = (hudBottomPx / canvasRect.height) * visibleWorldHeight;
  const trayWorld = (trayTopPx / canvasRect.height) * visibleWorldHeight;

  bounds.left = Math.max(0, worldLeft + markerPadX);
  bounds.right = Math.min(BOARD_WIDTH, worldRight - markerPadX);
  bounds.top = Math.max(worldTop + markerPadY, worldTop + hudWorld + sy(6));
  bounds.bottom = Math.min(worldBottom - markerPadY, worldBottom - trayWorld - sy(6));

  if (bounds.bottom <= bounds.top + sy(32)) {
    bounds.top = Math.max(worldTop + sy(12), bounds.top - sy(16));
    bounds.bottom = Math.min(worldBottom - sy(12), bounds.top + sy(80));
  }
  return bounds;
}

function resolveGuideAnchor(routePath, fallbackX, fallbackY, safeBounds) {
  const x = Number(fallbackX) || 0;
  const y = Number(fallbackY) || 0;
  if (!safeBounds || !Array.isArray(routePath) || routePath.length < 2) {
    return {
      x: Math.max(safeBounds ? safeBounds.left : 0, Math.min(safeBounds ? safeBounds.right : BOARD_WIDTH, x)),
      y: Math.max(safeBounds ? safeBounds.top : 0, Math.min(safeBounds ? safeBounds.bottom : BOARD_HEIGHT, y)),
    };
  }

  const inBounds = (p) => p
    && Number.isFinite(p.x)
    && Number.isFinite(p.y)
    && p.x >= safeBounds.left
    && p.x <= safeBounds.right
    && p.y >= safeBounds.top
    && p.y <= safeBounds.bottom;

  // Find first point already visible to keep anchors near the actual entrance.
  for (let i = 0; i < routePath.length; i += 1) {
    const p = routePath[i];
    if (inBounds(p)) {
      return { x: p.x, y: p.y };
    }
  }

  const clipSegmentToRect = (ax, ay, bx, by, rect) => {
    let t0 = 0;
    let t1 = 1;
    const dx = bx - ax;
    const dy = by - ay;

    const clipTest = (p, q) => {
      if (Math.abs(p) < 1e-7) {
        return q >= 0;
      }
      const r = q / p;
      if (p < 0) {
        if (r > t1) return false;
        if (r > t0) t0 = r;
      } else {
        if (r < t0) return false;
        if (r < t1) t1 = r;
      }
      return true;
    };

    if (!clipTest(-dx, ax - rect.left)) return null;
    if (!clipTest(dx, rect.right - ax)) return null;
    if (!clipTest(-dy, ay - rect.top)) return null;
    if (!clipTest(dy, rect.bottom - ay)) return null;

    if (t0 < 0 || t0 > 1) return null;
    return {
      x: ax + (dx * t0),
      y: ay + (dy * t0),
    };
  };

  // If entrance starts off-screen, pin the marker to where the route first
  // enters the playable bounds so it stays exactly on the path.
  for (let i = 1; i < routePath.length; i += 1) {
    const a = routePath[i - 1];
    const b = routePath[i];
    if (!a || !b) continue;
    const hit = clipSegmentToRect(a.x, a.y, b.x, b.y, safeBounds);
    if (hit) {
      return hit;
    }
  }

  return {
    x: Math.max(safeBounds.left, Math.min(safeBounds.right, x)),
    y: Math.max(safeBounds.top, Math.min(safeBounds.bottom, y)),
  };
}

function trimGuidePointsToPlayableBounds(points, safeBounds) {
  if (!Array.isArray(points) || points.length < 2 || !safeBounds) {
    return points;
  }
  const isInside = (p) => p
    && p.x >= safeBounds.left
    && p.x <= safeBounds.right
    && p.y >= safeBounds.top
    && p.y <= safeBounds.bottom;

  let first = -1;
  let last = -1;
  for (let i = 0; i < points.length; i += 1) {
    if (isInside(points[i])) {
      first = i;
      break;
    }
  }
  for (let i = points.length - 1; i >= 0; i -= 1) {
    if (isInside(points[i])) {
      last = i;
      break;
    }
  }

  if (first === -1 || last === -1 || last - first < 1) {
    return points;
  }
  return points.slice(first, last + 1);
}

function drawEnemySpawnLeadGlow(graphics, routePath, isHot, flowPhase = 0, safeBounds = null) {
  if (!graphics?.clear) {
    return;
  }
  graphics.clear();
  graphics.setVisible(true);
  graphics.setDepth(11.72);
  // Circle-only guidance: no lane glow, arrows, or decorative particles.
  graphics.setVisible(false);
}

function ensureEnemySpawnGuideAnimator() {
  if (!this.time || this.enemySpawnGuideAnimTicker) {
    return;
  }

  this.enemySpawnGuidePhase = Number(this.enemySpawnGuidePhase) || 0;
  this.enemySpawnGuideAnimTicker = this.time.addEvent({
    delay: 34,
    loop: true,
    callback: () => {
      if (!this.enemySpawnGuideActive) {
        return;
      }
      this.enemySpawnGuidePhase = (this.enemySpawnGuidePhase + ENTRANCE_GLOW_FLOW_STEP) % 1;
      const safeBounds = getPlayableWorldBounds(this);
      const markers = Array.isArray(this.enemySpawnMarkers) ? this.enemySpawnMarkers : [];
      markers.forEach((marker) => {
        if (!marker?.leadGlow) {
          return;
        }
        const anchor = resolveGuideAnchor(marker.routePath, marker.x, marker.y, safeBounds);
        marker.guideX = anchor.x;
        marker.guideY = anchor.y;
        const isHot = !!this.enemySpawnGuideHotKey && marker.key === this.enemySpawnGuideHotKey;
        const shouldShow = !this.enemySpawnGuideHotKey || isHot;
        if (shouldShow) {
          drawEnemySpawnLeadGlow(marker.leadGlow, marker.routePath, isHot, this.enemySpawnGuidePhase, safeBounds);
        } else {
          marker.leadGlow.clear();
          marker.leadGlow.setVisible(false);
        }
        animateEnemyEntranceBeacon(
          marker,
          this.enemySpawnGuidePhase,
          isHot,
          shouldShow,
          Number(this.enemySpawnArmPulseNonce || 0),
          this.enemySpawnGuideHideCircles
        );
      });
    },
  });
}

function animateEnemyEntranceBeacon(marker, phase = 0, isHot = false, showGuide = false, armPulseNonce = 0, hideCircles = false) {
  if (!marker) {
    return;
  }

  const ring = marker.ring;
  const core = marker.core;
  const label = marker.label;
  if (!ring || !core) {
    return;
  }

  const hostScene = ring?.scene || core?.scene || null;
  const canUseSpawnFx = !!(hostScene?.add?.sprite && hostScene?.anims?.exists?.('enemySpawnFxAllFrames'));

  const shouldShow = !!showGuide;
  if (!shouldShow) {
    ring.setVisible(false);
    core.setVisible(false);
    if (marker.spawnFx?.active) {
      marker.spawnFx.setVisible(false);
      marker.spawnFx.stop?.();
    }
    if (label) {
      label.setVisible(false);
    }
    return;
  }

  const offset = (Number(marker.phaseOffset) || 0);
  const localPhase = (Number(phase) + offset) % 1;
  const pulse = 0.5 + (0.5 * Math.sin(localPhase * Math.PI * 2));
  const guideX = Number.isFinite(Number(marker.guideX)) ? Number(marker.guideX) : Number(marker.x);
  const guideY = Number.isFinite(Number(marker.guideY)) ? Number(marker.guideY) : Number(marker.y);

  if (canUseSpawnFx) {
    const targetScale = isHot ? 0.42 : 0.34;
    if (!marker.spawnFx || !marker.spawnFx.active) {
      marker.spawnFx = hostScene.add.sprite(guideX, guideY, 'enemySpawnFxSheet', 0)
        .setOrigin(0.5, 0.5)
        .setDepth(11.96)
        .setScale(targetScale)
        .setAlpha(isHot ? 0.96 : 0.82);
    }
    const pulseNonce = Number(armPulseNonce) || 0;
    const shouldReplayPulse = pulseNonce > 0 && Number(marker.lastArmPulseNonce || 0) !== pulseNonce;
    if (shouldReplayPulse) {
      marker.lastArmPulseNonce = pulseNonce;
      marker.spawnFx.setFrame(0);
      marker.spawnFx.play('enemySpawnFxAllFrames');
    }
    const fxPlaying = !!marker.spawnFx.anims?.isPlaying;
    marker.spawnFx.setVisible(fxPlaying);
    marker.spawnFx.setPosition(guideX, guideY);
    marker.spawnFx.setScale(targetScale + (Math.sin(localPhase * Math.PI * 2) * 0.016));
    marker.spawnFx.setAlpha(isHot ? (0.9 + pulse * 0.08) : (0.72 + pulse * 0.08));

    // Hide circle guides if hideCircles is true, but keep spawn FX visible
    if (!hideCircles) {
      ring.setVisible(true);
      ring.clear();
      ring.lineStyle(Math.max(2.1, sx(2.8)), isHot ? 0xffb548 : 0x67cfff, isHot ? 0.95 : 0.7);
      ring.strokeCircle(guideX, guideY, isHot ? sx(16) : sx(11));
      ring.fillStyle(isHot ? 0xffb548 : 0x67cfff, isHot ? 0.08 : 0.05);
      ring.fillCircle(guideX, guideY, isHot ? sx(16) : sx(11));
    } else {
      ring.setVisible(false);
      ring.clear();
    }
    core.setVisible(false);
    core.clear();
    if (label) {
      label.setVisible(false);
    }
    return;
  }

  const edgeAlpha = isHot ? (0.95 - pulse * 0.16) : (0.7 - pulse * 0.14);
  const edgeColor = isHot ? 0xffb548 : 0x67cfff;
  const ringOuter = isHot ? sx(16) : sx(11);
  const breathing = isHot ? sx(1.7) : sx(1.1);

  // Hide circle guides if hideCircles is true
  if (!hideCircles) {
    ring.setVisible(true);
    ring.clear();
    ring.lineStyle(Math.max(2.1, sx(2.8)), edgeColor, edgeAlpha);
    ring.strokeCircle(guideX, guideY, ringOuter + ((pulse - 0.5) * breathing));
    ring.fillStyle(edgeColor, isHot ? 0.08 : 0.05);
    ring.fillCircle(guideX, guideY, ringOuter + ((pulse - 0.5) * breathing));
  } else {
    ring.setVisible(false);
    ring.clear();
  }

  core.setVisible(false);
  core.clear();

  if (label) {
    label.setVisible(false);
  }
}

function ensurePlaneDropPulseTicker() {
  if (!this.time || this.planeDropPulseTicker) {
    return;
  }

  this.planeDropPulsePhase = Number(this.planeDropPulsePhase) || 0;
  this.planeDropPulseTicker = this.time.addEvent({
    delay: 34,
    loop: true,
    callback: () => {
      if (!this.planeDropPulseActive) {
        return;
      }
      this.planeDropPulsePhase = (this.planeDropPulsePhase + 0.03) % 1;
      drawPlaneDropPulse.call(this);
    },
  });
}

function drawPlaneDropPulse() {
  if (!this.planeDropPulseGraphics) {
    this.planeDropPulseGraphics = this.add.graphics();
    this.planeDropPulseGraphics.setDepth(11.35);
  }

  const graphics = this.planeDropPulseGraphics;
  if (!this.planeDropPulseActive) {
    graphics.clear();
    graphics.setVisible(false);
    return;
  }

  const cx = Number.isFinite(this.planeDropPulseX) ? this.planeDropPulseX : (BOARD_WIDTH * 0.5);
  const cy = Number.isFinite(this.planeDropPulseY) ? this.planeDropPulseY : (BOARD_HEIGHT * 0.5);
  const mapCx = BOARD_WIDTH * 0.5;
  const mapCy = BOARD_HEIGHT * 0.5;
  const phase = Number(this.planeDropPulsePhase) || 0;
  const maxMapRadius = Math.hypot(BOARD_WIDTH, BOARD_HEIGHT) * 0.72;

  graphics.clear();

  if (this.planeDropPulseMode === 'edge-left') {
    const bandWidth = sx(64);
    const top = sy(36);
    const h = BOARD_HEIGHT - sy(72);

    const sweepCycles = Math.max(1, Number(this.planeDropEdgeSweepCycles || 2));
    const sweepDurationMs = Math.max(260, Number(this.planeDropEdgeSweepDurationMs || (980 * sweepCycles)));
    const sweepStartAt = Number(this.planeDropEdgeSweepStartAt || 0);
    const nowMs = Number(this.time?.now || 0);
    const elapsed = Math.max(0, nowMs - sweepStartAt);
    const progress = Math.min(1, sweepDurationMs > 0 ? (elapsed / sweepDurationMs) : 1);
    const sweepActive = !!this.planeDropEdgeSweepActive && progress < 1;
    if (sweepActive) {
      // Fade strip and sweep in/out across the full animation window.
      const envelope = Math.sin(progress * Math.PI);
      const stripAlpha = 0.04 + (0.12 * envelope);
      const sweepAlpha = 0.05 + (0.22 * envelope);

      graphics.fillStyle(0x8cdfff, stripAlpha);
      graphics.fillRect(0, top, bandWidth, h);
      const loopT = (progress * sweepCycles) % 1;
      const pingPong = loopT < 0.5 ? (loopT * 2) : ((1 - loopT) * 2);
      const smoothPingPong = pingPong * pingPong * (3 - (2 * pingPong));
      const sweepY = top + (h * smoothPingPong);
      graphics.fillStyle(0xffffff, sweepAlpha);
      graphics.fillRect(sx(2), sweepY - sy(4), bandWidth - sx(4), sy(8));
      graphics.setVisible(true);
    } else {
      this.planeDropEdgeSweepActive = false;
      // One-shot behavior: remove the strip when sweep is finished.
      this.planeDropPulseActive = false;
      this.planeDropPulseMode = null;
      graphics.clear();
      graphics.setVisible(false);
      if (this.planeDropPulseTicker?.remove) {
        this.planeDropPulseTicker.remove();
      }
      this.planeDropPulseTicker = null;
    }
    return;
  }

  for (let i = 0; i < 4; i += 1) {
    const t = (phase + (i * 0.24)) % 1;
    const radius = sx(120) + (maxMapRadius * t);
    const alpha = Math.max(0, 0.26 - (t * 0.2));
    graphics.lineStyle(Math.max(1.6, sx(2.2)), 0x8be9ff, alpha);
    graphics.strokeCircle(mapCx, mapCy, radius);
  }

  // Local drop cue ring follows the pointer while dragging.
  graphics.lineStyle(Math.max(2.2, sx(3.2)), 0xe7fbff, 0.9);
  graphics.strokeCircle(cx, cy, sx(34) + (Math.sin(phase * Math.PI * 2) * sx(3.2)));
  graphics.fillStyle(0xcdf8ff, 0.2);
  graphics.fillCircle(cx, cy, sx(14));
  graphics.setVisible(true);
}

function activatePlaneDropPulse(worldX, worldY, mode = 'pointer', options = null) {
  if (!this.add) {
    return;
  }
  this.planeDropPulseActive = true;
  this.planeDropPulseMode = mode;
  this.planeDropPulseX = Number.isFinite(worldX) ? worldX : (BOARD_WIDTH * 0.5);
  this.planeDropPulseY = Number.isFinite(worldY) ? worldY : (BOARD_HEIGHT * 0.5);
  if (mode === 'edge-left') {
    const triggerSweep = !!(options && options.triggerSweep);
    if (triggerSweep) {
      this.planeDropEdgeSweepActive = true;
      this.planeDropEdgeSweepStartAt = Number(this.time?.now || 0);
      this.planeDropEdgeSweepCycles = 2;
      this.planeDropEdgeSweepDurationMs = 980 * this.planeDropEdgeSweepCycles;
      ensurePlaneDropPulseTicker.call(this);
    }
  } else {
    ensurePlaneDropPulseTicker.call(this);
  }
  drawPlaneDropPulse.call(this);
}

function clearPlaneDropPulse() {
  this.planeDropPulseActive = false;
  this.planeDropPulseMode = null;
  this.planeDropEdgeSweepActive = false;
  this.planeDropEdgeSweepStartAt = 0;
  if (this.planeDropPulseTicker?.remove) {
    this.planeDropPulseTicker.remove();
  }
  this.planeDropPulseTicker = null;
  if (this.planeDropPulseGraphics?.clear) {
    this.planeDropPulseGraphics.clear();
    this.planeDropPulseGraphics.setVisible(false);
  }
}

export function clearEnemySpawnEntrances() {
  if (this.enemySpawnGuideAnimTicker?.remove) {
    this.enemySpawnGuideAnimTicker.remove();
  }
  this.enemySpawnGuideAnimTicker = null;
  this.enemySpawnGuideActive = false;
  this.enemySpawnGuideHotKey = null;
  clearPlaneDropPulse.call(this);
  if (this.planeDropPulseTicker?.remove) {
    this.planeDropPulseTicker.remove();
  }
  this.planeDropPulseTicker = null;
  if (this.planeDropPulseGraphics?.destroy) {
    this.planeDropPulseGraphics.destroy();
  }
  this.planeDropPulseGraphics = null;

  if (!Array.isArray(this.enemySpawnMarkers)) {
    this.enemySpawnMarkers = [];
    return;
  }

  this.enemySpawnMarkers.forEach((marker) => {
    if (marker?.leadGlow?.destroy) marker.leadGlow.destroy();
    if (marker?.ring?.destroy) marker.ring.destroy();
    if (marker?.core?.destroy) marker.core.destroy();
    if (marker?.label?.destroy) marker.label.destroy();
    if (marker?.spawnFx?.destroy) marker.spawnFx.destroy();
  });
  this.enemySpawnMarkers = [];
}

export function setupEnemySpawnEntrances() {
  this.clearEnemySpawnEntrances?.();
  if (!this.isMultiplayerEnemyCommanderRole()) {
    return;
  }

  const routeEntries = buildEnemySpawnRouteEntries.call(this) || [];
  const markers = [];
  const safeBounds = getPlayableWorldBounds(this);

  routeEntries.forEach((route, idx) => {
    const x = Number(route.x) || 0;
    const y = Number(route.y) || 0;
    const anchor = resolveGuideAnchor(route.path, x, y, safeBounds);

    const ring = this.add.graphics();
    ring.setDepth(11.84);
    ring.setVisible(false);

    const core = this.add.graphics();
    core.setDepth(11.9);
    core.setVisible(false);

    const label = this.add.text(anchor.x, anchor.y - sy(14), route.label || ('Route ' + String(idx + 1)), {
      fontFamily: 'Trebuchet MS',
      fontSize: Math.max(8, Math.round(sx(9))) + 'px',
      fontStyle: '700',
      color: '#b7deef',
      stroke: '#0e1b24',
      strokeThickness: Math.max(1, Math.round(sx(1))),
      align: 'center',
    });
    label.setOrigin(0.5, 1);
    label.setDepth(11.94);
    label.setVisible(false);

    const leadGlow = this.add.graphics();
    drawEnemySpawnLeadGlow(leadGlow, route.path, false, 0, safeBounds);
    leadGlow.setVisible(false);

    markers.push({
      key: route.key,
      labelText: route.label,
      x,
      y,
      routePath: Array.isArray(route.path) ? route.path : null,
      leadGlow,
      ring,
      core,
      label,
      spawnFx: null,
      lastArmPulseNonce: 0,
      guideX: anchor.x,
      guideY: anchor.y,
      phaseOffset: idx * 0.17,
    });
  });

  this.enemySpawnMarkers = markers;
}

export function getEnemySpawnDropTarget(worldX, worldY) {
  const markers = Array.isArray(this.enemySpawnMarkers) ? this.enemySpawnMarkers : [];
  if (!markers.length) {
    return null;
  }

  const pointToSegmentDistance = (px, py, ax, ay, bx, by) => {
    const vx = bx - ax;
    const vy = by - ay;
    const wx = px - ax;
    const wy = py - ay;
    const lenSq = (vx * vx) + (vy * vy);
    if (lenSq <= 0.0001) {
      return Math.hypot(px - ax, py - ay);
    }
    let t = ((wx * vx) + (wy * vy)) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const cx = ax + (vx * t);
    const cy = ay + (vy * t);
    return Math.hypot(px - cx, py - cy);
  };

  let best = null;
  let bestDist = Number.POSITIVE_INFINITY;
  const maxDist = sx(42);

  markers.forEach((marker) => {
    const hasVisibleGuide = !!(marker?.ring?.visible || marker?.leadGlow?.visible || this.enemySpawnGuideActive);
    const markerX = hasVisibleGuide && Number.isFinite(Number(marker.guideX))
      ? Number(marker.guideX)
      : Number(marker.x);
    const markerY = hasVisibleGuide && Number.isFinite(Number(marker.guideY))
      ? Number(marker.guideY)
      : Number(marker.y);
    const dx = worldX - markerX;
    const dy = worldY - markerY;
    const distance = Math.hypot(dx, dy);
    if (distance < bestDist) {
      bestDist = distance;
      best = marker;
    }
  });

  if (!best || bestDist > maxDist) {
    // Mobile-friendly fallback: allow dropping on highlighted route segments,
    // then map the drop to that route's entrance marker.
    let pathBest = null;
    let pathBestDist = Number.POSITIVE_INFINITY;
    const pathDropTolerance = sx(64);
    markers.forEach((marker) => {
      const path = Array.isArray(marker?.routePath) ? marker.routePath : null;
      if (!path || path.length < 2) {
        return;
      }
      const pathSampleEnd = Math.min(path.length - 1, Math.max(18, ENTRANCE_GLOW_POINTS + 6));
      for (let i = 1; i <= pathSampleEnd; i += 1) {
        const a = path[i - 1];
        const b = path[i];
        const d = pointToSegmentDistance(worldX, worldY, a.x, a.y, b.x, b.y);
        if (d < pathBestDist) {
          pathBestDist = d;
          pathBest = marker;
        }
      }
    });
    if (!pathBest || pathBestDist > pathDropTolerance) {
      return null;
    }
    return pathBest;
  }

  return best;
}

export function highlightEnemySpawnDropTarget(routeKey = undefined, showGuide = false, options = null) {
  const focusedRouteKey = routeKey === undefined
    ? (showGuide && !(options && options.allRoutes) ? (this.multiplayerRuntime?.selectedRouteKey || null) : null)
    : routeKey;
  const triggerArmPulse = !!(options && options.triggerArmPulse);
  const planeArmGlow = !!(options && options.planeArmGlow);
  const triggerPlaneSweep = !!(options && options.triggerPlaneSweep);
  const hideCircles = !!(options && options.hideCircles);
  if (triggerArmPulse) {
    this.enemySpawnArmPulseNonce = (Number(this.enemySpawnArmPulseNonce) || 0) + 1;
  }
  if (planeArmGlow) {
    activatePlaneDropPulse.call(this, sx(20), BOARD_HEIGHT * 0.5, 'edge-left', { triggerSweep: triggerPlaneSweep });
  } else {
    clearPlaneDropPulse.call(this);
  }
  this.enemySpawnGuideActive = !!showGuide;
  this.enemySpawnGuideHotKey = focusedRouteKey || null;
  this.enemySpawnGuideHideCircles = hideCircles;
  if (showGuide) {
    ensureEnemySpawnGuideAnimator.call(this);
    this.enemySpawnGuidePhase = (Number(this.enemySpawnGuidePhase) || 0) + ENTRANCE_GLOW_FLOW_STEP;
  }
  const safeBounds = getPlayableWorldBounds(this);

  const markers = Array.isArray(this.enemySpawnMarkers) ? this.enemySpawnMarkers : [];
  const hasHotRoute = !!focusedRouteKey;
  markers.forEach((marker) => {
    const anchor = resolveGuideAnchor(marker.routePath, marker.x, marker.y, safeBounds);
    marker.guideX = anchor.x;
    marker.guideY = anchor.y;
    const isHot = !!focusedRouteKey && marker.key === focusedRouteKey;
    if (marker.leadGlow) {
      if (showGuide) {
        if (hasHotRoute && !isHot) {
          marker.leadGlow.clear();
          marker.leadGlow.setVisible(false);
        } else {
          drawEnemySpawnLeadGlow(marker.leadGlow, marker.routePath, isHot, Number(this.enemySpawnGuidePhase) || 0, safeBounds);
        }
      } else {
        marker.leadGlow.clear();
        marker.leadGlow.setVisible(false);
      }
    }
    const shouldShowMarker = !!showGuide && (!hasHotRoute || isHot);
    animateEnemyEntranceBeacon(
      marker,
      Number(this.enemySpawnGuidePhase) || 0,
      isHot,
      shouldShowMarker,
      Number(this.enemySpawnArmPulseNonce || 0),
      hideCircles
    );
  });
}

export function updateEnemyDragDropHover(worldX, worldY, enemyDefRef = null) {
  if (!this.isMultiplayerEnemyCommanderRole()) {
    return false;
  }

  const enemyType = String(enemyDefRef?.enemyType || '').toLowerCase();
  if (enemyType === 'plane') {
    // Plane drops are map-wide and should not show entrance/path guidance.
    highlightEnemySpawnDropTarget.call(this, null, false, { planeArmGlow: true });
    return true;
  }

  const target = getEnemySpawnDropTarget.call(this, worldX, worldY);
  // During enemy arming, keep all entrances visibly animated so route options stay obvious.
  highlightEnemySpawnDropTarget.call(this, null, true, { hideCircles: true });
  return !!target;
}

function playEnemyDropFeedback(target, enemyDefRef, queued) {
  if (!target || !this.add) {
    return;
  }

  const effectX = Number.isFinite(Number(target.guideX)) ? Number(target.guideX) : Number(target.x || 0);
  const effectY = Number.isFinite(Number(target.guideY)) ? Number(target.guideY) : Number(target.y || 0);

  if (target.ring && this.tweens) {
    this.tweens.add({
      targets: target.ring,
      scaleX: 1.16,
      scaleY: 1.16,
      alpha: 1,
      yoyo: true,
      duration: 180,
      ease: 'Sine.Out',
    });
  }

  if (target.core && this.tweens) {
    this.tweens.add({
      targets: target.core,
      scaleX: 1.24,
      scaleY: 1.24,
      yoyo: true,
      duration: 150,
      ease: 'Sine.Out',
    });
  }

  const spawnFxAnimKey = 'enemySpawnFxAllFrames';
  if (this.add?.sprite && this.anims?.exists?.(spawnFxAnimKey)) {
    const safeBounds = getPlayableWorldBounds(this);
    const desiredScale = Math.max(0.24, Math.min(0.58, sx(92) / 240));
    const spaceTop = Math.max(sy(60), effectY - (safeBounds?.top || sy(40)));
    const fitScale = Math.max(0.24, Math.min(0.58, (spaceTop * 0.86) / 320));
    const fxScale = Math.min(desiredScale, fitScale);

    const spawnFx = this.add.sprite(effectX, effectY, 'enemySpawnFxSheet', 0)
      .setOrigin(0.5, 0.5)
      .setDepth(12.2)
      .setScale(fxScale);
    spawnFx.play(spawnFxAnimKey);
    spawnFx.once('animationcomplete', () => {
      if (spawnFx?.active) {
        spawnFx.destroy();
      }
    });
  }

  const splash = this.add.text(effectX, effectY - sy(26), '+' + String(queued) + ' ' + (enemyDefRef?.enemyType || 'unit'), {
    fontFamily: 'Trebuchet MS',
    fontSize: '14px',
    color: '#ffe5cc',
    stroke: '#25110c',
    strokeThickness: 3,
    fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(12.25);
  if (this.tweens) {
    this.tweens.add({
      targets: splash,
      y: target.y - sy(54),
      alpha: 0,
      duration: 520,
      ease: 'Quad.Out',
      onComplete: () => splash.destroy(),
    });
  } else {
    splash.destroy();
  }
}

export function queueCommanderBatchSpawn(enemyType, batchCount, routeKey, lane, spawnOriginX = null, spawnOriginY = null, forcedPlaneDirection = null) {
  if (!this.isMultiplayerEnemyCommanderRole()) {
    return 0;
  }
  this.commanderSpawnRejectReason = '';
  const runtime = this.multiplayerRuntime;
  const canAutoStartWaveFromPrep = !!(this.gameState?.prepPhase && this.isMultiplayerEnemyCommanderRole());
  if (!runtime?.waveActive && !canAutoStartWaveFromPrep) {
    return 0;
  }

  const targetCount = Math.max(1, Number(batchCount) || 1);
  const crowdCap = COMMANDER_ROUTE_ACTIVE_CAP_BY_TYPE[enemyType] || 8;
  const localCrowdCount = getCommanderLocalCrowdCount(this, enemyType, routeKey, lane);
  const allowedCount = Math.max(0, crowdCap - localCrowdCount);
  const spawnFamily = getCommanderSpawnFamily(enemyType);
  const globalCap = Number(COMMANDER_GLOBAL_ACTIVE_CAP_BY_FAMILY[spawnFamily] || 0);
  const globalCrowdCount = getCommanderGlobalCrowdCount(this, enemyType);
  const allowedGlobalCount = globalCap > 0
    ? Math.max(0, globalCap - globalCrowdCount)
    : targetCount;
  const queueCapForFamily = Number(COMMANDER_QUEUE_CAP_BY_FAMILY[spawnFamily] || 0);
  const queuedFamilyCount = getCommanderQueuedRouteFamilyCount(this, enemyType, routeKey, lane);
  const allowedQueueCount = queueCapForFamily > 0
    ? Math.max(0, queueCapForFamily - queuedFamilyCount)
    : targetCount;
  if (allowedCount <= 0) {
    this.commanderSpawnRejectReason = 'That lane is already crowded. Spread deployments across routes.';
    this.setStatus(this.commanderSpawnRejectReason, '#ffcf8a');
    return 0;
  }
  const finalTargetCount = Math.min(targetCount, allowedCount, allowedGlobalCount, allowedQueueCount);
  if (finalTargetCount <= 0) {
    this.commanderSpawnRejectReason = 'Too many ' + spawnFamily + ' units active right now. Wait for the current push to thin out.';
    this.setStatus(this.commanderSpawnRejectReason, '#ffcf8a');
    return 0;
  }
  const costEach = COMMANDER_COSTS[enemyType] || 0;
  if (costEach <= 0) {
    return 0;
  }

  if ((runtime.threat || 0) < costEach) {
    return 0;
  }
  // Commander tray costs represent one batch purchase, not per-unit purchase.
  runtime.threat = Math.max(0, (runtime.threat || 0) - costEach);

  let queued = 0;
  const planeDirection = forcedPlaneDirection === 'west' || forcedPlaneDirection === 'east'
    ? forcedPlaneDirection
    : (Number(spawnOriginX) > (BOARD_WIDTH * 0.5) ? 'west' : 'east');
  const planeVariantPool = enemyType === 'plane' ? getCommanderPlaneVariantPool(this) : [];
  const routeMarker = Array.isArray(this.enemySpawnMarkers)
    ? this.enemySpawnMarkers.find((entry) => String(entry?.key || '') === String(routeKey || ''))
    : null;
  const routePath = Array.isArray(routeMarker?.routePath) ? routeMarker.routePath : null;
  const formationBaseX = Number.isFinite(Number(spawnOriginX))
    ? Number(spawnOriginX)
    : Number(routeMarker?.x || (routePath?.[0]?.x || sx(42)));
  const formationBaseY = Number.isFinite(Number(spawnOriginY))
    ? Number(spawnOriginY)
    : Number(routeMarker?.y || (routePath?.[0]?.y || (BOARD_HEIGHT * 0.5)));

  let routeDirX = 1;
  let routeDirY = 0;
  if (routePath && routePath.length >= 2) {
    const start = routePath[0];
    const next = routePath[Math.min(routePath.length - 1, 2)];
    const dx = Number(next?.x || 0) - Number(start?.x || 0);
    const dy = Number(next?.y || 0) - Number(start?.y || 0);
    const len = Math.hypot(dx, dy);
    if (len > 0.001) {
      routeDirX = dx / len;
      routeDirY = dy / len;
    }
  }
  const routePerpX = -routeDirY;
  const routePerpY = routeDirX;
  const lateralPattern = [0, -1, 1, -2, 2, -3, 3, -4, 4];

  const batchMinGap = enemyType === 'tank'
    ? sx(92)
    : (enemyType === 'humvee'
      ? sx(52)
      : (enemyType === 'grenadier'
        ? sx(16)
        : (enemyType === 'plane' ? 0 : (enemyType === 'soldier' ? sx(118) : sx(76)))));
  const maxGapWaitMs = enemyType === 'tank'
    ? 760
    : (enemyType === 'humvee'
      ? 620
      : (enemyType === 'grenadier' ? 460 : (enemyType === 'plane' ? 0 : 320)));
  for (let i = 0; i < finalTargetCount; i += 1) {
    let queuedSpawnX = spawnOriginX;
    let queuedSpawnY = spawnOriginY;
    if (enemyType === 'plane') {
      const sourceY = Number.isFinite(Number(spawnOriginY)) ? Number(spawnOriginY) : (BOARD_HEIGHT * 0.5);
      const sourceX = Number.isFinite(Number(spawnOriginX)) ? Number(spawnOriginX) : -sx(80);
      const directionSign = planeDirection === 'east' ? -1 : 1;
      const maxFormationSpan = sy(300);
      const spacing = finalTargetCount > 1
        ? Math.min(sy(52), maxFormationSpan / (finalTargetCount - 1))
        : 0;
      const centeredOffsetIndex = i - ((finalTargetCount - 1) / 2);
      const unclampedY = sourceY + (centeredOffsetIndex * spacing);
      const minY = sy(80);
      const maxY = BOARD_HEIGHT - sy(80);
      // Keep formation centered around spawn origin so large batches do not start far offscreen.
      const unclampedX = sourceX + (directionSign * centeredOffsetIndex * sx(28));
      const minX = sx(18);
      const maxX = BOARD_WIDTH - sx(18);
      queuedSpawnX = Math.max(minX, Math.min(maxX, unclampedX));
      queuedSpawnY = Math.max(minY, Math.min(maxY, unclampedY));
    } else {
      const backStep = i * Math.max(sx(36), batchMinGap * 0.95);
      const lateralStep = lateralPattern[i % lateralPattern.length] * sx(8);
      const unclampedX = formationBaseX - (routeDirX * backStep) + (routePerpX * lateralStep);
      const unclampedY = formationBaseY - (routeDirY * backStep) + (routePerpY * lateralStep);
      queuedSpawnX = Math.max(sx(16), Math.min(BOARD_WIDTH - sx(16), unclampedX));
      queuedSpawnY = Math.max(sy(72), Math.min(BOARD_HEIGHT - sy(72), unclampedY));
    }
    const accepted = this.tryCommanderSpawn(enemyType, {
      forcedRouteKey: routeKey,
      planeLane: lane,
      planeDirection,
      planeVariantId: enemyType === 'plane' ? (planeVariantPool[i % planeVariantPool.length]?.id || '') : '',
      spawnAtEntrance: true,
      spawnOriginX: queuedSpawnX,
      spawnOriginY: queuedSpawnY,
      skipCost: true,
      ignoreCooldown: true,
      delayAfter: enemyType === 'tank'
        ? 120
        : (enemyType === 'plane'
          ? 180
          : (enemyType === 'grenadier' ? 140 : 120)),
      minGapFromPrev: batchMinGap,
      maxGapWaitMs,
    });
    if (!accepted) {
      break;
    }
    queued += 1;
  }

  runtime.cooldownByType[enemyType] = (this.time?.now || 0) + (COMMANDER_COOLDOWNS_MS[enemyType] || 400);
  this.updateMultiplayerCommanderHud?.(true);
  return queued;
}

export function handleEnemyTrayDrop(enemyDefRef, worldX, worldY) {
  if (!this.isMultiplayerEnemyCommanderRole()) {
    return false;
  }
  if (!enemyDefRef) {
    return false;
  }

  const enemyType = enemyDefRef.enemyType || 'soldier';
  const batchCount = Math.max(1, Number(enemyDefRef.batchCount) || 1);

  let target = null;
  let routeKey = this.multiplayerRuntime?.selectedRouteKey || this.getCommanderRouteOptions?.()[0]?.key || 'route1';
  let spawnX = null;
  let spawnY = null;
  let planeLane = this.multiplayerRuntime?.selectedPlaneLane || 'middle';
  let forcedPlaneDirection = null;

  if (enemyType === 'plane') {
    const dropY = Number.isFinite(worldY) ? worldY : (BOARD_HEIGHT * 0.5);
    const clampedY = Math.max(sy(80), Math.min(BOARD_HEIGHT - sy(80), dropY));
    planeLane = getEnemySpawnLaneForWorldY.call(this, clampedY) || 'middle';
    spawnX = sx(28);
    spawnY = clampedY;
    forcedPlaneDirection = 'east';
  } else {
    target = getEnemySpawnDropTarget.call(this, worldX, worldY);
    if (!target) {
      this.setStatus('Drop enemy units on a highlighted path lane.', '#ffb18b');
      return false;
    }
    routeKey = target.key;
    spawnX = Number.isFinite(worldX) ? worldX : target.x;
    spawnY = Number.isFinite(worldY) ? worldY : target.y;
    planeLane = this.multiplayerRuntime?.selectedPlaneLane || 'middle';
  }

  const queued = queueCommanderBatchSpawn.call(this, enemyType, batchCount, routeKey, planeLane, spawnX, spawnY, forcedPlaneDirection) || 0;

  if (queued <= 0) {
    highlightEnemySpawnDropTarget.call(this, null);
    const reason = String(this.commanderSpawnRejectReason || '').trim();
    if (!reason) {
      this.setStatus('Insufficient bounty to deploy ' + enemyDefRef.label + '.', '#ffb18b');
    }
    return false;
  }

  this.commanderSpawnRejectReason = '';
  highlightEnemySpawnDropTarget.call(this, null, true, { allRoutes: true, hideCircles: true });

  if (target) {
    playEnemyDropFeedback.call(this, target, enemyDefRef, queued);
  }

  if (target) {
    this.setStatus('Queued ' + queued + ' ' + enemyType + ' units at ' + (target.labelText || target.key) + '.', '#ffd7bf');
  } else {
    this.setStatus('Queued ' + queued + ' plane units. Air lane engaged left-to-right.', '#ffd7bf');
  }
  return true;
}

export function updateMultiplayerWaveRuntime(activeWaveEnemies = [], laneCleared = false) {
  if (!this.isMultiplayerModeEnabled()) {
    return;
  }

  const runtime = this.multiplayerRuntime;
  if (!runtime?.waveActive || this.gameState?.prepPhase || this.gameState?.gameOver) {
    this.updateMultiplayerCommanderHud?.();
    return;
  }

  if (this.isMultiplayerEnemyCommanderRole() && (!Array.isArray(this.enemySpawnMarkers) || this.enemySpawnMarkers.length === 0)) {
    this.setupEnemySpawnEntrances?.();
  }

  const now = this.time?.now || 0;
  const dtMs = Math.max(0, now - (runtime.lastTickAt || now));
  runtime.lastTickAt = now;

  runtime.threat = Math.min(
    runtime.threatMax || 0,
    (runtime.threat || 0) + ((runtime.threatRegenPerSec || 0) * (dtMs / 1000))
  );

  if (this.isMultiplayerEnemyCommanderRole() && ENABLE_OFFLINE_DEFENDER_AI_FALLBACK) {
    this.runDefenderTowerBot?.(activeWaveEnemies);
  }

  let spawnIterationsLeft = 10;
  while (spawnIterationsLeft > 0) {
    runtime.lastSpawnMetaByRoute = runtime.lastSpawnMetaByRoute || {};
    const canUseQueuedRouteStep = (step) => {
      const routeKey = String(step?.forcedRouteKey || 'route1');
      const routeLastSpawnMeta = runtime.lastSpawnMetaByRoute[routeKey] || null;
      const enemyType = String(step?.enemyType || 'soldier');
      const isArmored = enemyType === 'tank' || enemyType === 'humvee';
      const previousType = String(routeLastSpawnMeta?.enemyType || '');
      const previousWasArmored = previousType === 'tank' || previousType === 'humvee';
      const requiredGap = Math.max(
        Number(step?.minGapFromPrev || 0),
        isArmored ? sx(104) : sx(32),
        (isArmored && previousWasArmored) ? sx(142) : 0,
      );
      if (!routeLastSpawnMeta || requiredGap <= 0) return true;
      const previousEnemy = routeLastSpawnMeta.enemy;
      const elapsedSec = Math.max(0, (now - (routeLastSpawnMeta.spawnTime || now)) / 1000);
      const estimatedTravel = elapsedSec * Math.max(0, Number(routeLastSpawnMeta.speed || 0)) * 0.72;
      const traveled = previousEnemy?.active
        ? Math.max(0, this.getEnemyPathDistance(previousEnemy), estimatedTravel)
        : estimatedTravel;
      return traveled >= requiredGap;
    };

    let queuedIndex = 0;
    let queuedSpawn = (runtime.spawnQueue?.length || 0) > 0 ? runtime.spawnQueue[0] : null;
    if (queuedSpawn && now >= (this.nextEnemyTime || 0) && !canUseQueuedRouteStep(queuedSpawn)) {
      const blockedRouteKey = String(queuedSpawn.forcedRouteKey || 'route1');
      const alternateIndex = runtime.spawnQueue.findIndex((step, index) => (
        index > 0
        && String(step?.forcedRouteKey || 'route1') !== blockedRouteKey
        && canUseQueuedRouteStep(step)
      ));
      if (alternateIndex > 0) {
        queuedIndex = alternateIndex;
        queuedSpawn = runtime.spawnQueue[alternateIndex];
      }
    }
    if (!queuedSpawn) {
      break;
    }
    if (now < (this.nextEnemyTime || 0)) {
      break;
    }

    const queuedEnemyType = String(queuedSpawn.enemyType || 'soldier');
    const spawnRouteKey = String(queuedSpawn.forcedRouteKey || 'route1');
    runtime.lastSpawnMetaByRoute = runtime.lastSpawnMetaByRoute || {};
    const routeLastSpawnMeta = runtime.lastSpawnMetaByRoute[spawnRouteKey] || null;
    const requiredStepGap = Number(queuedSpawn.minGapFromPrev || 0);
    const previousEnemyType = String(routeLastSpawnMeta?.enemyType || '');
    const previousWasArmored = previousEnemyType === 'tank' || previousEnemyType === 'humvee';
    const isQueuedArmored = queuedEnemyType === 'tank' || queuedEnemyType === 'humvee';
    const baseMovementGate = isQueuedArmored ? sx(104) : sx(32);
    const vehiclePairGate = (isQueuedArmored && previousWasArmored) ? sx(142) : 0;
    const requiredGap = Math.max(requiredStepGap, baseMovementGate, vehiclePairGate);
    let canSpawn = true;

    if (requiredGap > 0 && routeLastSpawnMeta) {
      const prevEnemy = routeLastSpawnMeta.enemy;
      let traveled = 0;
      const elapsedSec = Math.max(0, (now - (routeLastSpawnMeta.spawnTime || now)) / 1000);
      const speedEstimate = Math.max(0, Number(routeLastSpawnMeta.speed || 0));
      const estimatedTravel = elapsedSec * speedEstimate * 0.72;
      if (prevEnemy?.active) {
        traveled = Math.max(0, this.getEnemyPathDistance(prevEnemy));
        traveled = Math.max(traveled, estimatedTravel);
      } else {
        traveled = estimatedTravel;
      }
      canSpawn = traveled >= requiredGap;
    }

    if (!canSpawn) {
      this.nextEnemyTime = now + 16;
      break;
    }

    if (canSpawn && isQueuedArmored) {
      const queuedRouteKey = String(queuedSpawn.forcedRouteKey || 'route1');
      const minArmoredRouteHeadway = queuedEnemyType === 'tank' ? sx(132) : sx(116);
      const entryStackDistance = queuedEnemyType === 'tank' ? sx(76) : sx(68);
      let closestArmoredAheadDistance = Number.POSITIVE_INFINITY;
      let blockedAtEntry = false;
      const spawnX = Number(queuedSpawn.spawnOriginX);
      const spawnY = Number(queuedSpawn.spawnOriginY);
      const hasSpawnOrigin = Number.isFinite(spawnX) && Number.isFinite(spawnY);

      this.enemies.children.entries.forEach((enemy) => {
        if (!enemy?.active || enemy.getData('isPlane') || enemy.getData('isTestDummy')) {
          return;
        }
        const otherType = String(enemy.getData('enemyType') || '');
        if (otherType !== 'tank' && otherType !== 'humvee') {
          return;
        }
        if (String(enemy.getData('routeKey') || 'route1') !== queuedRouteKey) {
          return;
        }

        const distanceAlongRoute = Math.max(0, this.getEnemyPathDistance(enemy));
        if (distanceAlongRoute < closestArmoredAheadDistance) {
          closestArmoredAheadDistance = distanceAlongRoute;
        }

        if (hasSpawnOrigin) {
          const localDistance = Math.hypot(enemy.x - spawnX, enemy.y - spawnY);
          if (localDistance < entryStackDistance) {
            blockedAtEntry = true;
          }
        }
      });

      if (closestArmoredAheadDistance < minArmoredRouteHeadway || blockedAtEntry) {
        canSpawn = false;
      }
    }

    if (!canSpawn) {
      this.nextEnemyTime = now + 16;
      break;
    }

    const spawnStep = runtime.spawnQueue.splice(queuedIndex, 1)[0];
    const spawnedEnemy = this.spawnEnemy(spawnStep.enemyType || 'soldier', spawnStep);
    this.lastSpawnMeta = {
      enemy: spawnedEnemy,
      spawnTime: now,
      speed: spawnedEnemy?.getData('speed') || 0,
      enemyType: queuedEnemyType,
      routeKey: spawnRouteKey,
    };
    runtime.lastSpawnMetaByRoute[spawnRouteKey] = this.lastSpawnMeta;
    this.enemyCount = Math.max(this.enemyCount || 0, this.enemiesSpawned || 0);
    const delayAfter = Math.max(12, Number(spawnStep.delayAfter || 120));
    this.nextEnemyTime = now + delayAfter;
    spawnIterationsLeft -= 1;
  }

  const noPendingQueue = (runtime.spawnQueue?.length || 0) === 0;
  const waveExpired = now >= (runtime.waveEndsAt || 0);
  const noActiveEnemies = laneCleared || activeWaveEnemies.length === 0;

  if (!runtime.clearPending && waveExpired && noPendingQueue && noActiveEnemies) {
    runtime.clearPending = true;
    runtime.waveActive = false;
    this.enemyCount = Math.max(this.enemyCount || 0, this.enemiesResolved || 0, this.enemiesSpawned || 0);
    const isAttackRole = !!this.isMultiplayerEnemyCommanderRole?.();
    const defenderLivesRemaining = Math.max(0, Number(this.gameState?.lives || 0));
    if (isAttackRole && defenderLivesRemaining > 0) {
      this.gameState.attackEndReason = 'defenderHold';
      this.endGame?.();
      return;
    }

    // Evaluate online unlock triggers after each online defender wave.
    if (!isAttackRole && this.isMultiplayerModeEnabled?.()) {
      const completedWave = Math.max(1, Number(this.gameState?.wave || 1));
      const isWin = completedWave >= 10;
      try {
        const newUnlocks = this.checkOnlineWeaponUnlocks?.({
          gamePlayed: completedWave === 1,
          waveSurvived: completedWave,
          matchWon: isWin,
        });
        if (Array.isArray(newUnlocks) && newUnlocks.length > 0) {
          this._pendingOnlineWeaponUnlocks = newUnlocks;
        }
      } catch (_) {}
    }

    this.nextWave();
    return;
  }

  const online = runtime.online || null;
  if (online?.matched && !this.isMultiplayerEnemyCommanderRole()) {
    const nowMs = this.time?.now || 0;
    if (nowMs >= (online.lastStatePushAt || 0)) {
      online.lastStatePushAt = nowMs + ONLINE_STATE_PUSH_INTERVAL_MS;
      sendOnlineMatchMessage(this, {
        type: 'state_update',
        matchId: online.matchId || '',
        lives: Number(this.gameState?.lives || 0),
        wave: Number(this.gameState?.wave || 1),
        prepPhase: !!this.gameState?.prepPhase,
        gameOver: !!this.gameState?.gameOver,
        queueCount: Number((runtime.spawnQueue || []).length || 0),
        timestamp: Date.now(),
      });
    }
  }

  this.updateMultiplayerCommanderHud?.();
}

export function runDefenderTowerBot(activeWaveEnemies = []) {
  if (!this.isMultiplayerModeEnabled() || !this.isMultiplayerEnemyCommanderRole()) {
    return;
  }

  if (this.multiplayerRuntime?.online?.matched) {
    return;
  }

  const runtime = this.multiplayerRuntime;
  if (!runtime?.waveActive || this.gameState?.prepPhase || this.gameState?.gameOver) {
    return;
  }

  const now = this.time?.now || 0;
  if (now < (runtime.defenderBotNextPlaceAt || 0)) {
    return;
  }

  const wave = Math.max(1, Number(this.gameState?.wave || 1));
  const placedTowers = this.towers?.getChildren?.() || [];

  const routeOptions = this.getCommanderRouteOptions?.() || [];
  const routeSegmentsByKey = new Map();
  if (Array.isArray(this.customSpawnRoutes) && this.customSpawnRoutes.length > 0) {
    this.customSpawnRoutes.forEach((route, index) => {
      const key = route?.key || ('route' + String(index + 1));
      if (Array.isArray(route?.segments) && route.segments.length > 0) {
        routeSegmentsByKey.set(key, route.segments);
      }
    });
  } else {
    if (Array.isArray(this.pathSegments) && this.pathSegments.length > 0) routeSegmentsByKey.set('route1', this.pathSegments);
    if (Array.isArray(this.secondaryPathSegments) && this.secondaryPathSegments.length > 0) routeSegmentsByKey.set('route2', this.secondaryPathSegments);
    if (Array.isArray(this.tertiaryPathSegments) && this.tertiaryPathSegments.length > 0) routeSegmentsByKey.set('route3', this.tertiaryPathSegments);
    if (Array.isArray(this.quaternaryPathSegments) && this.quaternaryPathSegments.length > 0) routeSegmentsByKey.set('route4', this.quaternaryPathSegments);
  }

  const getNearestRouteKeyForPoint = (x, y) => {
    let bestKey = routeOptions[0]?.key || 'route1';
    let bestDist = Number.POSITIVE_INFINITY;
    routeSegmentsByKey.forEach((segments, key) => {
      for (let i = 0; i < segments.length; i += 1) {
        const seg = segments[i];
        const d = this.distanceToSegment
          ? this.distanceToSegment(x, y, seg.start.x, seg.start.y, seg.end.x, seg.end.y)
          : Math.hypot(x - seg.start.x, y - seg.start.y);
        if (d < bestDist) {
          bestDist = d;
          bestKey = key;
        }
      }
    });
    return bestKey;
  };

  const enemyPressureByRoute = {};
  routeOptions.forEach((route) => {
    enemyPressureByRoute[route.key] = 0;
  });
  (Array.isArray(activeWaveEnemies) ? activeWaveEnemies : []).forEach((enemy) => {
    if (!enemy?.active) {
      return;
    }
    const explicitKey = String(enemy.getData?.('customRouteKey') || '').trim();
    const routeKey = explicitKey && enemyPressureByRoute[explicitKey] !== undefined
      ? explicitKey
      : getNearestRouteKeyForPoint(Number(enemy.x) || 0, Number(enemy.y) || 0);
    const progress = Number(this.getEnemyPathDistance?.(enemy) || 0);
    const pressureWeight = 1 + Math.min(1.2, progress / Math.max(1, sx(760)));
    enemyPressureByRoute[routeKey] = (enemyPressureByRoute[routeKey] || 0) + pressureWeight;
  });

  const laneCoverageByRoute = {};
  routeOptions.forEach((route) => {
    laneCoverageByRoute[route.key] = 0;
  });
  placedTowers.forEach((tower) => {
    if (!tower?.active) {
      return;
    }
    const routeKey = getNearestRouteKeyForPoint(Number(tower.x) || 0, Number(tower.y) || 0);
    const towerRange = Number(tower.getData?.('range') || sx(240));
    const towerDamage = Number(tower.getData?.('damage') || 1);
    const towerFireRate = Math.max(120, Number(tower.getData?.('fireRate') || 900));
    const strength = ((towerRange / sx(240)) * 0.5) + (((towerDamage * 1000) / towerFireRate) * 0.22);
    laneCoverageByRoute[routeKey] = (laneCoverageByRoute[routeKey] || 0) + strength;
  });

  const laneNeedByRoute = {};
  routeOptions.forEach((route) => {
    const pressureVal = Number(enemyPressureByRoute[route.key] || 0);
    const coverVal = Number(laneCoverageByRoute[route.key] || 0);
    laneNeedByRoute[route.key] = Math.max(0, pressureVal - (coverVal * 0.92));
  });

  const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));
  const routeThreatMemory = (runtime.defenderRouteHeat && typeof runtime.defenderRouteHeat === 'object')
    ? runtime.defenderRouteHeat
    : {};
  runtime.defenderRouteHeat = routeThreatMemory;
  const routeThreatForecastByKey = {};
  let routeForecastPeak = 0;
  routeOptions.forEach((route) => {
    const key = route.key;
    const immediateThreat = Number(enemyPressureByRoute[key] || 0);
    const laneNeed = Number(laneNeedByRoute[key] || 0);
    const memory = Number(routeThreatMemory[key] || 0);
    const forecast = Math.max(0, (immediateThreat * 0.62) + (laneNeed * 1.08) + (memory * 0.58));
    routeThreatForecastByKey[key] = forecast;
    routeThreatMemory[key] = (memory * 0.74) + (forecast * 0.26);
    if (forecast > routeForecastPeak) {
      routeForecastPeak = forecast;
    }
  });

  // Strategic anchors bias placements toward meaningful choke and mid-lane points
  // even when there are not many live enemies yet.
  const strategicLaneAnchors = [];
  const anchorFractions = [0.22, 0.38, 0.54, 0.7];
  routeOptions.forEach((route) => {
    const segments = routeSegmentsByKey.get(route.key) || [];
    if (!Array.isArray(segments) || segments.length === 0) {
      return;
    }
    const maxIdx = Math.max(0, segments.length - 1);
    anchorFractions.forEach((ratio) => {
      const idx = Math.min(maxIdx, Math.max(0, Math.floor(maxIdx * ratio)));
      const seg = segments[idx];
      if (!seg?.start || !seg?.end) {
        return;
      }
      strategicLaneAnchors.push({
        x: (Number(seg.start.x || 0) + Number(seg.end.x || 0)) * 0.5,
        y: (Number(seg.start.y || 0) + Number(seg.end.y || 0)) * 0.5,
        need: Number(routeThreatForecastByKey[route.key] || laneNeedByRoute[route.key] || 0),
      });
    });
  });

  const getRouteNeedAtPoint = (x, y) => {
    const routeKey = getNearestRouteKeyForPoint(x, y);
    return Number(laneNeedByRoute[routeKey] || 0);
  };
  const getRouteForecastAtPoint = (x, y) => {
    const routeKey = getNearestRouteKeyForPoint(x, y);
    return Number(routeThreatForecastByKey[routeKey] || 0);
  };
  if (!runtime.defenderBotTowerUsage || typeof runtime.defenderBotTowerUsage !== 'object') {
    runtime.defenderBotTowerUsage = {};
  }
  if (!runtime.defenderBotTowerLearn || typeof runtime.defenderBotTowerLearn !== 'object') {
    runtime.defenderBotTowerLearn = {};
  }
  if (!Array.isArray(runtime.defenderBotPlacementHistory)) {
    runtime.defenderBotPlacementHistory = [];
  }

  const defeatedNow = Math.max(0, Number(this.enemiesDefeated || 0));
  const lastDefeated = Math.max(0, Number(runtime.defenderBotLastEnemyDefeated || 0));
  const killDelta = Math.max(0, defeatedNow - lastDefeated);
  if (killDelta > 0 && runtime.defenderBotLastPlacedKey) {
    const key = runtime.defenderBotLastPlacedKey;
    runtime.defenderBotTowerLearn[key] = (runtime.defenderBotTowerLearn[key] || 0) + (killDelta * 0.45);
  }
  runtime.defenderBotLastEnemyDefeated = defeatedNow;

  const killsNow = Math.max(0, Number(this.enemiesDefeated || 0));
  const lastKillCount = Number.isFinite(runtime.defenderBotLastKillCount)
    ? runtime.defenderBotLastKillCount
    : killsNow;
  const newKills = Math.max(0, killsNow - lastKillCount);
  if (!Number.isFinite(runtime.defenderBotGold)) {
    runtime.defenderBotGold = DEFENDER_BOT_START_GOLD;
  }
  if (newKills > 0) {
    runtime.defenderBotGold += newKills * DEFENDER_BOT_GOLD_PER_KILL;
  }
  runtime.defenderBotLastKillCount = killsNow;

  const baseCap = wave <= 1
    ? (this.gameState?.selectedMode === 'vsAiAttack' ? 7 : 10)
    : Math.min(13, 7 + Math.floor((wave - 1) * 1.6));
  const killCapBonus = Math.floor(killsNow / 7);
  const defenderTowerCap = Math.min(16, baseCap + killCapBonus);
  const currentTowerCount = this.towers?.getChildren?.().length || 0;
  const placedThisWave = Number(runtime.defenderBotPlacedThisWave || 0);
  if (currentTowerCount >= defenderTowerCap || placedThisWave >= defenderTowerCap) {
    runtime.defenderBotNextPlaceAt = now + 2600;
    return;
  }

  const useFreePlacement = !!this.isFreePlacementEnabled?.();
  const openSlots = !useFreePlacement && Array.isArray(this.towerBaseSlots)
    ? this.towerBaseSlots.filter((slot) => !slot.occupied)
    : [];
  const canPlaceNewTower = useFreePlacement || openSlots.length > 0;

  const unlocked = (this.towerCatalog || []).filter((towerDef) => this.isWeaponUnlockedForPlayer(towerDef));
  if (!unlocked.length) {
    runtime.defenderBotNextPlaceAt = now + 2800;
    return;
  }

  const pressure = Math.max(0, Array.isArray(activeWaveEnemies) ? activeWaveEnemies.length : 0);
  const enemyMix = {
    infantry: 0,
    armor: 0,
    air: 0,
  };
  (Array.isArray(activeWaveEnemies) ? activeWaveEnemies : []).forEach((enemy) => {
    if (!enemy?.active) return;
    const type = enemy.getData?.('enemyType') || '';
    if (enemy.getData?.('isPlane') || type === 'plane') {
      enemyMix.air += 1;
    } else if (enemy.getData?.('isHumvee') || type === 'tank' || type === 'humvee') {
      enemyMix.armor += 1;
    } else {
      enemyMix.infantry += 1;
    }
  });

  const antiAirTowers = placedTowers.filter((tower) => {
    const pref = String(tower?.getData?.('targetPreference') || '').toLowerCase();
    const range = Number(tower?.getData?.('range') || 0);
    return pref === 'air' || range >= sx(320);
  }).length;
  const antiArmorTowers = placedTowers.filter((tower) => {
    const heavyBonus = Number(tower?.getData?.('heavyBonus') || 1);
    const armorPen = Number(tower?.getData?.('armorPen') || 0);
    return heavyBonus >= 1.22 || armorPen >= 0.45;
  }).length;

  const hist = runtime.defenderBotPlacementHistory;
  const lastA = hist.length > 0 ? hist[hist.length - 1] : null;
  const lastB = hist.length > 1 ? hist[hist.length - 2] : null;
  const enemyTotal = Math.max(1, enemyMix.infantry + enemyMix.armor + enemyMix.air);
  const infPressure = enemyMix.infantry / enemyTotal;
  const armPressure = enemyMix.armor / enemyTotal;
  const airPressure = enemyMix.air / enemyTotal;
  const antiAirNeed = Math.max(0, airPressure - (antiAirTowers / Math.max(1, currentTowerCount)));
  const antiArmorNeed = Math.max(0, armPressure - (antiArmorTowers / Math.max(1, currentTowerCount)));

  const classifyTowerProfile = (towerLike) => {
    const pref = String(towerLike?.targetPreference || towerLike?.getData?.('targetPreference') || '').toLowerCase();
    const range = Number(towerLike?.range || towerLike?.getData?.('range') || 0);
    const armorPen = Number(towerLike?.armorPen || towerLike?.getData?.('armorPen') || 0);
    const heavyBonus = Number(towerLike?.heavyBonus || towerLike?.getData?.('heavyBonus') || 1);
    const splash = Math.max(
      Number(towerLike?.splashRadius || towerLike?.getData?.('splashRadius') || 0),
      Number(towerLike?.rocketSplashRadius || towerLike?.getData?.('rocketSplashRadius') || 0),
      Number(towerLike?.laserLaneRadius || towerLike?.getData?.('laserLaneRadius') || 0)
    );
    return {
      antiAir: pref === 'air' || range >= sx(212),
      antiArmor: pref === 'heavy' || pref === 'strongest' || armorPen >= 1.1 || heavyBonus >= 1.32,
      aoe: splash > 0 || pref === 'cluster',
    };
  };

  let placedAntiAir = 0;
  let placedAntiArmor = 0;
  let placedAoe = 0;
  placedTowers.forEach((tower) => {
    if (!tower?.active) return;
    const profile = classifyTowerProfile(tower);
    if (profile.antiAir) placedAntiAir += 1;
    if (profile.antiArmor) placedAntiArmor += 1;
    if (profile.aoe) placedAoe += 1;
  });
  const placedCount = Math.max(1, currentTowerCount);
  const currentAntiAirRatio = placedAntiAir / placedCount;
  const currentAntiArmorRatio = placedAntiArmor / placedCount;
  const currentAoeRatio = placedAoe / placedCount;
  const pathDistances = (Array.isArray(activeWaveEnemies) ? activeWaveEnemies : [])
    .filter((enemy) => enemy?.active)
    .map((enemy) => Number(this.getEnemyPathDistance?.(enemy) || 0));
  const maxPathProgress = pathDistances.length ? Math.max(...pathDistances) : 0;
  const meanPathProgress = pathDistances.length
    ? (pathDistances.reduce((sum, value) => sum + value, 0) / pathDistances.length)
    : 0;
  const dangerScalar = Math.min(1.35, Math.max(0, (maxPathProgress / Math.max(1, sx(900)))));

  const waveDurationMs = Math.max(1000, Number(runtime.waveDurationMs || 1));
  const waveStartedAt = Number(runtime.waveStartedAt || now);
  const waveElapsedMs = Math.max(0, now - waveStartedAt);
  const waveProgress = clamp01(waveElapsedMs / waveDurationMs);
  const livesNow = Math.max(0, Number(this.gameState?.lives || 0));
  const panicActive = livesNow <= 2 || dangerScalar >= 1.02 || routeForecastPeak >= 7.6;
  const openingActive = !panicActive && (wave <= 1 || waveProgress < 0.36 || currentTowerCount < 6);
  const doctrine = panicActive ? 'panic' : (openingActive ? 'opening' : 'midgame');
  runtime.defenderDoctrine = doctrine;

  const doctrineProfile = doctrine === 'panic'
    ? {
      reserveMultiplier: 0.24,
      reserveFloor: 28,
      antiAirBias: 0.03,
      antiArmorBias: 0.05,
      aoeBias: 0.02,
      placeBias: 0.1,
      upgradeBias: 0.95,
      tempoMultiplier: 0.42,
      forecastWeight: 1.32,
      anchorWeight: 1.1,
      spendAll: true,
    }
    : (doctrine === 'opening'
      ? {
        reserveMultiplier: 0.68,
        reserveFloor: 64,
        antiAirBias: -0.02,
        antiArmorBias: 0.06,
        aoeBias: 0.08,
        placeBias: 0.72,
        upgradeBias: -0.48,
        tempoMultiplier: 0.74,
        forecastWeight: 0.94,
        anchorWeight: 1.22,
        spendAll: false,
      }
      : {
        reserveMultiplier: 1,
        reserveFloor: 82,
        antiAirBias: 0.02,
        antiArmorBias: 0.03,
        aoeBias: 0.03,
        placeBias: 0,
        upgradeBias: 0,
        tempoMultiplier: 1,
        forecastWeight: 1,
        anchorWeight: 1,
        spendAll: false,
      });

  const desiredAntiAirRatio = Math.max(0.12, Math.min(0.56, 0.18 + (airPressure * 0.9) + doctrineProfile.antiAirBias));
  const desiredAntiArmorRatio = Math.max(0.14, Math.min(0.58, 0.2 + (armPressure * 0.95) + doctrineProfile.antiArmorBias));
  const desiredAoeRatio = Math.max(0.2, Math.min(0.64, 0.27 + (infPressure * 0.85) + doctrineProfile.aoeBias));
  const antiAirDeficit = Math.max(0, desiredAntiAirRatio - currentAntiAirRatio);
  const antiArmorDeficit = Math.max(0, desiredAntiArmorRatio - currentAntiArmorRatio);
  const aoeDeficit = Math.max(0, desiredAoeRatio - currentAoeRatio);
  const compositionGap = antiAirDeficit + antiArmorDeficit + aoeDeficit;

  const reserveScale = clamp01((routeForecastPeak / 6.5) + (dangerScalar * 0.45));
  const reservedGold = Math.round(Math.max(
    doctrineProfile.reserveFloor,
    Math.min(
      320,
      ((wave <= 1 ? 180 : 240) * reserveScale + (compositionGap * 120)) * doctrineProfile.reserveMultiplier
    )
  ));
  runtime.defenderBotReservedGold = reservedGold;
  const isCriticalDefenseWindow = dangerScalar >= 0.92 || routeForecastPeak >= 6.8;
  const botSpendBudget = (isCriticalDefenseWindow || doctrineProfile.spendAll)
    ? Math.max(0, Number(runtime.defenderBotGold || 0))
    : Math.max(0, Number(runtime.defenderBotGold || 0) - reservedGold);

  const scoreTowerStrategicFit = (candidate) => {
    const cost = Math.max(1, Number(candidate?.cost || 0));
    const range = Math.max(1, Number(candidate?.range || sx(180)));
    const fireRate = Math.max(120, Number(candidate?.fireRate || 900));
    const damage = Math.max(0.1, Number(candidate?.damage || 1));
    const armorPen = Math.max(0, Number(candidate?.armorPen || 0));
    const heavyBonus = Math.max(0.5, Number(candidate?.heavyBonus || 1));
    const splash = Math.max(
      Number(candidate?.splashRadius || 0),
      Number(candidate?.rocketSplashRadius || 0),
      Number(candidate?.laserLaneRadius || 0),
      0
    );
    const pref = String(candidate?.targetPreference || '').toLowerCase();
    const dps = damage * (1000 / fireRate);
    const antiArmorPower = (armorPen * 0.8) + Math.max(0, heavyBonus - 1);
    const aoePower = splash > 0 ? (splash / sx(88)) : 0;
    const antiAirPower = pref === 'air' ? 1.6 : (range >= sx(208) ? 0.3 : 0);
    const roleProfile = classifyTowerProfile(candidate);
    const efficiency = dps / cost;

    const rangePenalty = (wave <= 1 && range < sx(168)) ? 0.9 : 0;
    const weakDamagePenalty = (wave <= 1 && damage < 1.35 && splash <= 0) ? 0.8 : 0;
    const preferenceFit =
      (infPressure * (0.45 + (aoePower * 0.65)))
      + (armPressure * (0.38 + (antiArmorPower * 0.95)))
      + (airPressure * (0.32 + (antiAirPower * 0.9)));

    return (dps * 0.68)
      + (efficiency * 22)
      + (range / sx(170)) * 0.85
      + (aoePower * (1 + infPressure * 1.3))
      + (antiArmorPower * (0.85 + armPressure * 1.2))
      + (antiAirPower * (0.65 + airPressure * 1.4))
      + (preferenceFit * 1.05)
      + (roleProfile.antiAir ? (antiAirDeficit * 2.4) : 0)
      + (roleProfile.antiArmor ? (antiArmorDeficit * 2.6) : 0)
      + (roleProfile.aoe ? (aoeDeficit * 2.35) : 0)
      - rangePenalty
      - weakDamagePenalty;
  };

  const affordableRaw = unlocked
    .filter((towerDef) => botSpendBudget >= (towerDef.cost || 0));
  let affordable = affordableRaw
    .slice()
    .sort((a, b) => scoreTowerStrategicFit(b) - scoreTowerStrategicFit(a));

  if (wave <= 1 && pressure >= 3) {
    const strongFiltered = affordable.filter((candidate) => {
      const range = Number(candidate?.range || 0);
      const damage = Number(candidate?.damage || 0);
      const armorPen = Number(candidate?.armorPen || 0);
      const splash = Math.max(Number(candidate?.splashRadius || 0), Number(candidate?.rocketSplashRadius || 0), Number(candidate?.laserLaneRadius || 0));
      return range >= sx(172) || damage >= 1.7 || armorPen >= 0.9 || splash > 0;
    });
    if (strongFiltered.length > 0) {
      affordable = strongFiltered;
    }
  }

  const tryUpgradeTower = () => {
    if (!placedTowers.length) {
      return false;
    }
    const waveUpgradeCap = Math.min(6, 1 + Math.floor(wave / 2));
    const candidates = placedTowers.filter((tower) => {
      if (!tower?.active) {
        return false;
      }
      const level = Math.max(1, Number(tower.getData('upgradeLevel') || 1));
      if (level >= waveUpgradeCap) {
        return false;
      }
      const cost = Number(this.getTowerUpgradeCost?.(tower) || 0);
      return cost > 0 && botSpendBudget >= cost;
    });
    if (!candidates.length) {
      return false;
    }

    let bestTower = null;
    let bestScore = Number.NEGATIVE_INFINITY;
    candidates.forEach((tower) => {
      const cost = Number(this.getTowerUpgradeCost?.(tower) || 0);
      const level = Math.max(1, Number(tower.getData('upgradeLevel') || 1));
      const routeNeed = getRouteNeedAtPoint(Number(tower.x) || 0, Number(tower.y) || 0);
      const towerRange = Number(tower.getData('range') || sx(240));
      const towerDamage = Number(tower.getData('damage') || 1);
      const towerFireRate = Math.max(120, Number(tower.getData('fireRate') || 900));
      const dps = (towerDamage * 1000) / towerFireRate;
      const pref = String(tower.getData('targetPreference') || '').toLowerCase();
      const roleFit = pref === 'air'
        ? (0.45 + (airPressure * 1.1))
        : (pref === 'strongest' ? (0.35 + (armPressure * 0.9)) : (0.25 + (infPressure * 0.55)));
      const localEnemyWeight = (Array.isArray(activeWaveEnemies) ? activeWaveEnemies : []).reduce((sum, enemy) => {
        if (!enemy?.active) {
          return sum;
        }
        const dist = Math.hypot((Number(enemy.x) || 0) - (Number(tower.x) || 0), (Number(enemy.y) || 0) - (Number(tower.y) || 0));
        if (dist > Math.max(sx(100), towerRange * 1.25)) {
          return sum;
        }
        const progress = Number(this.getEnemyPathDistance?.(enemy) || 0);
        return sum + Math.max(0.2, 1 - (dist / Math.max(1, towerRange * 1.25))) * (1 + Math.min(1, progress / Math.max(1, sx(700))));
      }, 0);
      const efficiency = dps / Math.max(1, cost);
      const levelPenalty = Math.max(0, level - 1) * 0.32;
      const score = (routeNeed * 1.25) + (localEnemyWeight * 0.95) + (roleFit * 1.2) + (efficiency * 28) - levelPenalty;
      if (score > bestScore) {
        bestScore = score;
        bestTower = tower;
      }
    });

    if (!bestTower) {
      return false;
    }

    const cost = Number(this.getTowerUpgradeCost?.(bestTower) || 0);
    if (cost <= 0 || botSpendBudget < cost || (runtime.defenderBotGold || 0) < cost) {
      return false;
    }

    const nextLevel = Math.max(1, Number(bestTower.getData('upgradeLevel') || 1)) + 1;
    bestTower.setData('upgradeLevel', nextLevel);
    const localAttackAi = this.gameState?.selectedMode === 'vsAiAttack';
    bestTower.setData('damage', (bestTower.getData('damage') || 1) * (localAttackAi ? 1.08 : 1.22));
    bestTower.setData('range', (bestTower.getData('range') || sx(230)) * 1.04);
    bestTower.setData('fireRate', Math.max(90, Math.round((bestTower.getData('fireRate') || 900) * 0.94)));
    bestTower.setData('armorPen', (bestTower.getData('armorPen') || 0) + 0.18);
    bestTower.setData('towerArmor', (bestTower.getData('towerArmor') || 0) + 0.12);
    const nextMaxHealth = Math.max(1, (bestTower.getData('maxHealth') || 1) + 1);
    bestTower.setData('maxHealth', nextMaxHealth);
    bestTower.setData('health', Math.min(nextMaxHealth, (bestTower.getData('health') || nextMaxHealth) + 1));

    const boostedScale = Math.min(1.15, (bestTower.getData('baseScale') || bestTower.scaleX || 0.6) * 1.035);
    bestTower.setData('baseScale', boostedScale);
    bestTower.setScale(boostedScale);
    const fireAnimSprite = bestTower.getData('fireAnimSprite');
    if (fireAnimSprite?.active) {
      fireAnimSprite.setScale(boostedScale);
    }
    const towerIdLabel = bestTower.getData('idLabel');
    if (towerIdLabel?.active) {
      const towerId = bestTower.getData('towerId') || '?';
      towerIdLabel.setText(String(towerId) + ' L' + nextLevel);
    }
    this.syncTowerHealthVisual?.(bestTower);

    runtime.defenderBotGold = Math.max(0, (runtime.defenderBotGold || 0) - cost);
    runtime.defenderBotNextPlaceAt = now + Math.max(480, 1220 - Math.floor(pressure * 26));
    return true;
  };

  const earlyBuildPhase = wave <= 1 && currentTowerCount < 8;
  const totalLaneNeed = routeOptions.reduce((sum, route) => sum + Number(laneNeedByRoute[route.key] || 0), 0);
  const placeActionScore = canPlaceNewTower && affordable.length > 0
    ? (1.15 + (compositionGap * 1.45) + (totalLaneNeed * 0.11) + (routeForecastPeak * 0.2) + (earlyBuildPhase ? 0.85 : 0) + (pressure * 0.03) + doctrineProfile.placeBias)
    : Number.NEGATIVE_INFINITY;
  const upgradeActionScore = placedTowers.length > 0
    ? (0.95 + (dangerScalar * 0.9) + (routeForecastPeak * 0.17) + (pressure * 0.045) + (canPlaceNewTower ? -0.18 : 0.34) + (earlyBuildPhase ? -0.52 : 0.24) + doctrineProfile.upgradeBias)
    : Number.NEGATIVE_INFINITY;
  if (upgradeActionScore > placeActionScore && tryUpgradeTower()) {
    return;
  }

  if (!canPlaceNewTower) {
    runtime.defenderBotNextPlaceAt = now + 1800;
    return;
  }

  if (!affordable.length) {
    runtime.defenderBotNextPlaceAt = now + (wave <= 1 ? 900 : 1400);
    return;
  }

  let towerDef = affordable[0];
  let bestScore = Number.NEGATIVE_INFINITY;
  affordable.forEach((candidate) => {
    if (!candidate) {
      return;
    }
    const key = candidate.key || ('tower-' + String(candidate.id || 0));
    const usage = runtime.defenderBotTowerUsage[key] || 0;
    const learn = runtime.defenderBotTowerLearn[key] || 0;

    const dps = (candidate.damage || 1) * (1000 / Math.max(120, candidate.fireRate || 900));
    const rangeScore = (candidate.range || 0) / 120;
    const aoeScore = ((candidate.splashRadius || 0) / 30) + ((candidate.rocketSplashRadius || 0) / 32);
    const armorScore = (candidate.armorPen || 0) + Math.max(0, (candidate.heavyBonus || 1) - 1);
    const pref = String(candidate.targetPreference || '').toLowerCase();
    const antiAir = pref === 'air' ? 1.8 : ((candidate.range || 0) >= sx(320) ? 0.5 : 0);
    const antiArmor = pref === 'strongest' ? 0.7 : 0;
    const economyFactor = (runtime.defenderBotGold || 0) < 140
      ? ((candidate.cost || 0) <= 90 ? 0.45 : -0.22)
      : 0;
    const timingFactor = (pressure > 8 || dangerScalar > 0.7)
      ? ((candidate.fireRate || 900) <= 420 ? 0.34 : 0)
      : 0;

    const repeatPenalty = (lastA && key === lastA ? 0.9 : 0) + (lastA && lastB && key === lastA && key === lastB ? 1.1 : 0);
    const usagePenalty = usage * 0.58;
    const adaptBoost = learn * 0.32;
    const strategicFit = scoreTowerStrategicFit(candidate);

    const score =
      (dps * (0.78 + (dangerScalar * 0.35)))
      + (rangeScore * (0.45 + (airPressure * 0.4)))
      + (aoeScore * (0.4 + (infPressure * 0.75)))
      + (armorScore * (0.55 + (armPressure * 0.9)))
      + (antiAir * (0.42 + (airPressure * 1.45) + (antiAirNeed * 1.35)))
      + (antiArmor * (0.2 + (antiArmorNeed * 1.2)))
      + (strategicFit * 0.95)
      + adaptBoost
      + economyFactor
      + timingFactor
      - repeatPenalty
      - usagePenalty
      + (Math.random() * 0.08);

    if (score > bestScore) {
      bestScore = score;
      towerDef = candidate;
    }
  });

  let placed = false;

  const allPathSegments = [
    this.pathSegments,
    this.secondaryPathSegments,
    this.tertiaryPathSegments,
    this.quaternaryPathSegments,
  ].filter((segments) => Array.isArray(segments) && segments.length > 0);
  const getNearestPathDistance = (x, y) => {
    let best = Number.POSITIVE_INFINITY;
    allPathSegments.forEach((segments) => {
      segments.forEach((seg) => {
        const d = this.distanceToSegment
          ? this.distanceToSegment(x, y, seg.start.x, seg.start.y, seg.end.x, seg.end.y)
          : Math.hypot(x - seg.start.x, y - seg.start.y);
        if (d < best) {
          best = d;
        }
      });
    });
    return Number.isFinite(best) ? best : sx(999);
  };

  const evaluatePlacementCandidate = (x, y, candidateTowerDef) => {
    const towerRange = Number(candidateTowerDef?.range || sx(260));
    const pref = String(candidateTowerDef?.targetPreference || '').toLowerCase();
    const hasAoe = Number(candidateTowerDef?.splashRadius || 0) > 0 || Number(candidateTowerDef?.rocketSplashRadius || 0) > 0;
    const antiArmor = Number(candidateTowerDef?.armorPen || 0) + Math.max(0, Number(candidateTowerDef?.heavyBonus || 1) - 1);

    let coverageScore = 0;
    (Array.isArray(activeWaveEnemies) ? activeWaveEnemies : []).forEach((enemy) => {
      if (!enemy?.active) {
        return;
      }
      const ex = Number(enemy.x) || 0;
      const ey = Number(enemy.y) || 0;
      const dist = Math.hypot(ex - x, ey - y);
      if (dist > (towerRange * 1.2)) {
        return;
      }

      const pathProg = Number(this.getEnemyPathDistance?.(enemy) || 0);
      const progressWeight = Math.max(0.45, 0.65 + (pathProg / Math.max(1, meanPathProgress || sx(600))));
      const proxWeight = Math.max(0.15, 1 - (dist / Math.max(1, towerRange * 1.2)));
      const type = enemy.getData?.('enemyType') || '';
      const isAir = !!enemy.getData?.('isPlane') || type === 'plane';
      const isArmor = !!enemy.getData?.('isHumvee') || type === 'tank' || type === 'humvee';
      const typeWeight = isAir
        ? (pref === 'air' ? 1.7 : 0.65)
        : (isArmor ? (1 + (antiArmor * 0.8)) : (hasAoe ? 1.2 : 1));
      coverageScore += proxWeight * progressWeight * typeWeight;
    });

    const idealPathDist = Math.max(sx(38), Math.min(towerRange * 0.55, sx(132)));
    const pathDist = getNearestPathDistance(x, y);
    const pathFitScore = Math.max(0, 1 - (Math.abs(pathDist - idealPathDist) / Math.max(idealPathDist, sx(40))));
    const laneNeedScore = getRouteNeedAtPoint(x, y);
    const forecastScore = getRouteForecastAtPoint(x, y);
    let anchorScore = 0;
    if (strategicLaneAnchors.length > 0) {
      let bestWeighted = Number.POSITIVE_INFINITY;
      let secondWeighted = Number.POSITIVE_INFINITY;
      strategicLaneAnchors.forEach((anchor) => {
        const dist = Math.hypot((Number(anchor.x) || 0) - x, (Number(anchor.y) || 0) - y);
        const weighted = dist / Math.max(0.7, 1 + (anchor.need * 0.22));
        if (weighted < bestWeighted) {
          secondWeighted = bestWeighted;
          bestWeighted = weighted;
        } else if (weighted < secondWeighted) {
          secondWeighted = weighted;
        }
      });

      const nearA = Math.max(0, 1 - (bestWeighted / Math.max(sx(160), towerRange * 0.92)));
      const nearB = Number.isFinite(secondWeighted)
        ? Math.max(0, 1 - (secondWeighted / Math.max(sx(210), towerRange * 1.2)))
        : 0;
      anchorScore = (nearA * 1.7) + (nearB * 0.8);
    }

    let spacingPenalty = 0;
    placedTowers.forEach((tower) => {
      if (!tower?.active) {
        return;
      }
      const d = Math.hypot((Number(tower.x) || 0) - x, (Number(tower.y) || 0) - y);
      if (d < sx(84)) {
        spacingPenalty += (sx(84) - d) / sx(84);
      }
    });

    return (coverageScore * 1.2)
      + (pathFitScore * 3.25)
      + (laneNeedScore * 1.55)
      + (forecastScore * 0.62 * doctrineProfile.forecastWeight)
      + (anchorScore * 1.35 * doctrineProfile.anchorWeight)
      - (spacingPenalty * 1.8);
  };

  if (useFreePlacement) {
    const randInt = (min, max) => Math.floor(min + (Math.random() * Math.max(1, (max - min + 1))));
    const minX = Math.floor(sx(120));
    const maxX = Math.ceil(BOARD_WIDTH - sx(120));
    const minY = Math.floor(sy(190));
    const maxY = Math.ceil(BOARD_HEIGHT - sy(180));

    const candidates = [];
    const gridStepX = Math.max(56, Math.floor(sx(96)));
    const gridStepY = Math.max(56, Math.floor(sy(92)));
    for (let gy = minY; gy <= maxY; gy += gridStepY) {
      for (let gx = minX; gx <= maxX; gx += gridStepX) {
        candidates.push({ x: gx, y: gy });
      }
    }

    const scored = candidates.map((c) => ({
      x: c.x,
      y: c.y,
      score: evaluatePlacementCandidate(c.x, c.y, towerDef),
    }));
    scored.sort((a, b) => b.score - a.score);

    runtime.allowDefenderBypass = true;

    for (let i = 0; i < scored.length && !placed; i += 1) {
      const c = scored[i];
      const valid = this.getFreePlacementValidation?.(c.x, c.y);
      if (!valid?.valid) {
        continue;
      }
      placed = !!this.tryPlaceTower(c.x, c.y, towerDef);
    }

    // Focused fallback around lane pressure hotspots for resilient placement.
    const liveEnemies = (Array.isArray(activeWaveEnemies) ? activeWaveEnemies : []).filter((enemy) => enemy?.active);
    const fallbackAnchor = liveEnemies.length
      ? liveEnemies[Math.floor(Math.random() * liveEnemies.length)]
      : null;
    for (let i = 0; i < 64 && !placed; i += 1) {
      const jitter = Math.max(sx(120), (towerDef?.range || sx(240)) * 0.8);
      const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
      const x = fallbackAnchor
        ? clamp(Math.floor((fallbackAnchor.x || BOARD_WIDTH * 0.5) + randInt(-jitter, jitter)), minX, maxX)
        : randInt(minX, maxX);
      const y = fallbackAnchor
        ? clamp(Math.floor((fallbackAnchor.y || BOARD_HEIGHT * 0.5) + randInt(-jitter, jitter)), minY, maxY)
        : randInt(minY, maxY);
      const valid = this.getFreePlacementValidation?.(x, y);
      if (!valid?.valid) {
        continue;
      }
      placed = !!this.tryPlaceTower(x, y, towerDef);
    }

    runtime.allowDefenderBypass = false;
  } else {
    const slotScores = openSlots
      .map((slot) => ({
        slot,
        score: evaluatePlacementCandidate(slot.x, slot.y, towerDef),
      }))
      .sort((a, b) => b.score - a.score);
    const slot = slotScores[0]?.slot || openSlots[0];
    runtime.allowDefenderBypass = true;
    placed = !!this.tryPlaceTower(slot.x, slot.y, towerDef);
    runtime.allowDefenderBypass = false;
  }

  if (!placed) {
    runtime.defenderBotNextPlaceAt = now + 1200;
    return;
  }

  runtime.defenderBotPlacedThisWave = placedThisWave + 1;
  runtime.defenderBotGold = Math.max(0, (runtime.defenderBotGold || 0) - (towerDef?.cost || 0));
  if (towerDef) {
    const placedKey = towerDef.key || ('tower-' + String(towerDef.id || 0));
    runtime.defenderBotTowerUsage[placedKey] = (runtime.defenderBotTowerUsage[placedKey] || 0) + 1;
    runtime.defenderBotLastPlacedKey = placedKey;
    runtime.defenderBotPlacementHistory.push(placedKey);
    if (runtime.defenderBotPlacementHistory.length > 8) {
      runtime.defenderBotPlacementHistory.shift();
    }
  }

  // Higher pressure/waves place slightly faster to simulate an active defending opponent.
  const baseDelay = wave <= 1
    ? Math.max(700, 1900 - (wave * 90))
    : Math.max(1000, 3200 - (wave * 140));
  const pressureBonus = Math.min(900, pressure * 35);
  const dangerBonus = Math.min(600, Math.floor(dangerScalar * 380));
  const baselineDelay = Math.max(240, (baseDelay - pressureBonus - dangerBonus) * doctrineProfile.tempoMultiplier);
  if (wave <= 1 && pressure >= 4 && (runtime.defenderBotGold || 0) >= 85) {
    runtime.defenderBotNextPlaceAt = now + Math.max(120, Math.floor(180 * doctrineProfile.tempoMultiplier));
  } else {
    runtime.defenderBotNextPlaceAt = now + baselineDelay;
  }
}

export function seedDefenderBotLoadout() {
  if (!this.isMultiplayerEnemyCommanderRole()) {
    return;
  }

  const runtime = this.multiplayerRuntime;
  if (!runtime || runtime.defenderBotSeeded) {
    return;
  }

  const placeSpots = Array.isArray(this.towerBaseSlots)
    ? this.towerBaseSlots.filter((slot) => !slot.occupied)
    : [];

  const unlocked = (this.towerCatalog || []).filter((towerDef) => this.isWeaponUnlockedForPlayer(towerDef));
  const loadout = unlocked
    .slice()
    .sort((a, b) => {
      const dpsA = (Number(a?.damage || 1) * 1000) / Math.max(120, Number(a?.fireRate || 900));
      const dpsB = (Number(b?.damage || 1) * 1000) / Math.max(120, Number(b?.fireRate || 900));
      const rangeA = Number(a?.range || sx(220));
      const rangeB = Number(b?.range || sx(220));
      return ((dpsB * 1.15) + (rangeB * 0.0028)) - ((dpsA * 1.15) + (rangeA * 0.0028));
    })
    .slice(0, 6);
  if (!loadout.length) {
    return;
  }

  runtime.allowDefenderBypass = true;
  if (placeSpots.length > 0) {
    const placeCount = Math.min(this.gameState?.selectedMode === 'vsAiAttack' ? 3 : 6, placeSpots.length);
    for (let i = 0; i < placeCount; i += 1) {
      const slot = placeSpots[i];
      const towerDef = loadout[i % loadout.length];
      this.tryPlaceTower(slot.x, slot.y, towerDef);
    }
  } else {
    const fallbackCoords = [
      { x: BOARD_WIDTH * 0.34, y: BOARD_HEIGHT * 0.58 },
      { x: BOARD_WIDTH * 0.42, y: BOARD_HEIGHT * 0.5 },
      { x: BOARD_WIDTH * 0.5, y: BOARD_HEIGHT * 0.62 },
      { x: BOARD_WIDTH * 0.58, y: BOARD_HEIGHT * 0.52 },
      { x: BOARD_WIDTH * 0.3, y: BOARD_HEIGHT * 0.46 },
      { x: BOARD_WIDTH * 0.66, y: BOARD_HEIGHT * 0.6 },
    ];
    let placed = 0;
    const fallbackLimit = this.gameState?.selectedMode === 'vsAiAttack' ? 3 : 6;
    for (let i = 0; i < fallbackCoords.length && placed < fallbackLimit; i += 1) {
      const towerDef = loadout[placed % loadout.length];
      const didPlace = this.tryPlaceTower(fallbackCoords[i].x, fallbackCoords[i].y, towerDef);
      if (didPlace) {
        placed += 1;
      }
    }
  }
  runtime.allowDefenderBypass = false;
  runtime.defenderBotSeeded = true;

  this.setStatus('Defender network ally seeded defensive towers. Enemy command ready.', '#9edcff');
}

export function setupMultiplayerCommanderOverlay() {
  if (typeof document === 'undefined') {
    return;
  }

  // Keep multiplayer HUD lean: role is chosen in world-select, so skip the in-game commander modal.
  if (this.htmlMultiplayerRoot?.isConnected) {
    this.htmlMultiplayerRoot.remove();
  }
  this.htmlMultiplayerRoot = null;
  this.htmlMultiplayerOverlayNode = null;
  this.htmlMultiplayerValues = null;
  return;

  if (this.htmlMultiplayerRoot?.isConnected) {
    this.syncHtmlHudOverlayBounds?.();
    this.updateMultiplayerCommanderHud?.(true);
    return;
  }

  fetch('/multiplayer-commander-modal.html')
    .then((response) => response.text())
    .then((markup) => {
      if (this.scene?.isDestroyed) {
        return;
      }

      if (this.htmlMultiplayerRoot?.isConnected) {
        this.htmlMultiplayerRoot.remove();
      }

      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-multiplayer-overlay-root', 'true');
      wrapper.innerHTML = markup;
      document.body.appendChild(wrapper);

      this.htmlMultiplayerRoot = wrapper;
      this.htmlMultiplayerOverlayNode = wrapper.querySelector('#mp-command-overlay');
      this.htmlMultiplayerValues = {
        mode: wrapper.querySelector('[data-mp="mode"]'),
        role: wrapper.querySelector('[data-mp="role"]'),
        timer: wrapper.querySelector('[data-mp="timer"]'),
        threatValue: wrapper.querySelector('[data-mp="threat-value"]'),
        threatMeta: wrapper.querySelector('[data-mp="threat-meta"]'),
        threatFill: wrapper.querySelector('[data-mp="threat-fill"]'),
        queue: wrapper.querySelector('[data-mp="queue"]'),
        state: wrapper.querySelector('[data-mp="state"]'),
        routes: wrapper.querySelector('[data-mp="routes"]'),
      };

      const renderRouteButtons = () => {
        const routeHost = this.htmlMultiplayerValues?.routes;
        if (!routeHost) {
          return;
        }
        routeHost.innerHTML = '';
        const options = this.getCommanderRouteOptions?.() || [];
        options.forEach((option) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'mp-btn';
          btn.textContent = option.label;
          btn.setAttribute('data-route', option.key);
          btn.addEventListener('click', () => this.setCommanderRouteKey(option.key));
          routeHost.appendChild(btn);
        });
      };

      renderRouteButtons();

      wrapper.querySelectorAll('[data-spawn]').forEach((button) => {
        button.addEventListener('click', () => {
          const type = button.getAttribute('data-spawn') || '';
          if (!type) {
            return;
          }
          if (!this.isMultiplayerEnemyCommanderRole()) {
            this.setStatus('Enemy commander controls are read-only in Defender role.', '#ffcf8a');
            return;
          }
          this.tryCommanderSpawn(type);
        });
      });

      wrapper.querySelectorAll('[data-lane]').forEach((button) => {
        button.addEventListener('click', () => {
          const lane = button.getAttribute('data-lane') || 'middle';
          this.setCommanderPlaneLane(lane);
        });
      });

      if (!this.htmlMultiplayerResizeHandler && typeof window !== 'undefined') {
        this.htmlMultiplayerResizeHandler = () => this.syncHtmlHudOverlayBounds?.();
        window.addEventListener('resize', this.htmlMultiplayerResizeHandler);
      }
      if (!this.htmlMultiplayerScaleResizeHandler && this.scale) {
        this.htmlMultiplayerScaleResizeHandler = () => this.syncHtmlHudOverlayBounds?.();
        this.scale.on('resize', this.htmlMultiplayerScaleResizeHandler);
      }

      this.syncHtmlHudOverlayBounds?.();
      this.syncMultiplayerCommanderVisibility?.();
      this.updateMultiplayerCommanderHud?.(true);
    })
    .catch(() => {});
}

export function syncMultiplayerCommanderVisibility() {
  if (!this.htmlMultiplayerOverlayNode) {
    return;
  }

  const shouldShow = this.isMultiplayerModeEnabled()
    && !this.gameState?.gameOver
    && !!this.gameState;
  const runtimeRole = this.multiplayerRuntime?.role || this.gameState?.multiplayerRole || 'defender';
  const compactForEnemy = runtimeRole === 'enemyCommander';

  const showOverlay = shouldShow && !compactForEnemy;
  this.htmlMultiplayerOverlayNode.style.display = showOverlay ? 'block' : 'none';
  this.htmlMultiplayerOverlayNode.classList.toggle('mp-compact', compactForEnemy);
}

export function updateMultiplayerCommanderHud(force = false) {
  const now = this.time?.now || 0;
  if (!force && now < (this.nextMultiplayerHudUpdateAt || 0)) {
    return;
  }
  this.nextMultiplayerHudUpdateAt = now + 90;

  const runtime = this.multiplayerRuntime || {};
  const role = runtime.role || (this.gameState?.multiplayerRole || 'defender');
  const roleIsEnemyCommander = role === 'enemyCommander';

  // Keep tray mode/cards synced even if modal overlay is not mounted.
  if (typeof window !== 'undefined' && typeof window.__setHtmlTrayMode === 'function') {
    window.__setHtmlTrayMode(roleIsEnemyCommander ? 'enemy' : 'weapon');
  }
  if (roleIsEnemyCommander) {
    this.pushEnemyTrayCardsToHtml?.();
  }

  if (!this.htmlMultiplayerValues || !this.htmlMultiplayerOverlayNode) {
    return;
  }

  if (roleIsEnemyCommander && (!Array.isArray(this.enemySpawnMarkers) || this.enemySpawnMarkers.length === 0)) {
    this.setupEnemySpawnEntrances?.();
  }

  const modeText = this.gameState?.selectedMode === 'vsAi'
    ? 'VS AI'
    : (this.isMultiplayerModeEnabled() ? 'Multiplayer' : 'Solo');

  if (this.htmlMultiplayerValues.mode) {
    this.htmlMultiplayerValues.mode.textContent = 'Mode: ' + modeText;
  }
  if (this.htmlMultiplayerValues.role) {
    this.htmlMultiplayerValues.role.textContent = 'Role: ' + getRoleLabel(role);
  }

  const timerRemaining = runtime.waveActive
    ? Math.max(0, (runtime.waveEndsAt || 0) - now)
    : 0;
  if (this.htmlMultiplayerValues.timer) {
    this.htmlMultiplayerValues.timer.textContent = 'Wave: ' + toTimerText(timerRemaining);
  }

  const threat = Math.max(0, runtime.threat || 0);
  const threatMax = Math.max(1, runtime.threatMax || 1);
  const threatPct = clamp01(threat / threatMax);

  if (this.htmlMultiplayerValues.threatValue) {
    this.htmlMultiplayerValues.threatValue.textContent = String(Math.floor(threat));
  }
  if (this.htmlMultiplayerValues.threatMeta) {
    this.htmlMultiplayerValues.threatMeta.textContent = 'Combat earnings';
  }
  if (this.htmlMultiplayerValues.threatFill) {
    this.htmlMultiplayerValues.threatFill.style.width = (threatPct * 100).toFixed(1) + '%';
  }
  if (this.htmlMultiplayerValues.queue) {
    this.htmlMultiplayerValues.queue.textContent = 'Queued: ' + String((runtime.spawnQueue || []).length);
  }

  const stateText = this.gameState?.prepPhase
    ? 'Build Phase'
    : (runtime.waveActive ? 'Wave Active' : 'Standby');
  if (this.htmlMultiplayerValues.state) {
    this.htmlMultiplayerValues.state.textContent = stateText;
  }

  this.htmlMultiplayerOverlayNode.classList.toggle('mp-compact', roleIsEnemyCommander);

  const selectedRoute = runtime.selectedRouteKey || 'route1';
  this.htmlMultiplayerOverlayNode.querySelectorAll('[data-route]').forEach((button) => {
    button.classList.toggle('is-active', button.getAttribute('data-route') === selectedRoute);
  });

  const selectedLane = runtime.selectedPlaneLane || 'middle';
  this.htmlMultiplayerOverlayNode.querySelectorAll('[data-lane]').forEach((button) => {
    button.classList.toggle('is-active', button.getAttribute('data-lane') === selectedLane);
  });

  const localCanCommand = this.isMultiplayerEnemyCommanderRole() && runtime.waveActive && !this.gameState?.prepPhase && !this.gameState?.gameOver;
  this.htmlMultiplayerOverlayNode.querySelectorAll('[data-spawn]').forEach((button) => {
    const spawnType = button.getAttribute('data-spawn') || 'soldier';
    const cost = COMMANDER_COSTS[spawnType] || 0;
    const unlocked = isCommanderSpawnTypeUnlocked(this, spawnType);
    const cooldownAt = runtime.cooldownByType?.[spawnType] || 0;
    const onCooldown = cooldownAt > now;
    const affordable = threat >= cost;
    button.disabled = !localCanCommand || !unlocked || !affordable || onCooldown;
    const remainsMs = Math.max(0, cooldownAt - now);
    const remains = Math.ceil(remainsMs / 1000);
    const baseLabel = getCommanderSpawnTypeLabel(spawnType) + ' ' + String(cost);
    if (!unlocked) {
      const neededLevel = getCommanderSpawnUnlockLevel(spawnType);
      button.textContent = getCommanderSpawnTypeLabel(spawnType) + ' LV' + String(neededLevel);
    } else if (onCooldown) {
      button.textContent = baseLabel + '  (' + remains + 's)';
    } else {
      button.textContent = baseLabel;
    }
  });

  if (roleIsEnemyCommander && typeof window !== 'undefined' && typeof window.__updateHtmlEnemyTray === 'function') {
    const spawnLabels = {};
    const spawnEnabled = {};
    Object.keys(COMMANDER_COSTS).forEach((spawnType) => {
      const cost = COMMANDER_COSTS[spawnType] || 0;
      const unlocked = isCommanderSpawnTypeUnlocked(this, spawnType);
      const cooldownAt = runtime.cooldownByType?.[spawnType] || 0;
      const onCooldown = cooldownAt > now;
      const remainsMs = Math.max(0, cooldownAt - now);
      const remains = Math.ceil(remainsMs / 1000);
      const baseLabel = getCommanderSpawnTypeLabel(spawnType) + ' ' + String(cost);
      if (!unlocked) {
        const neededLevel = getCommanderSpawnUnlockLevel(spawnType);
        spawnLabels[spawnType] = getCommanderSpawnTypeLabel(spawnType) + ' LV' + String(neededLevel);
      } else {
        spawnLabels[spawnType] = onCooldown ? (baseLabel + ' (' + remains + 's)') : baseLabel;
      }
      spawnEnabled[spawnType] = !!(localCanCommand && unlocked && !onCooldown && threat >= cost);
    });

    window.__updateHtmlEnemyTray({
      roleLabel: 'Enemy Cmdr',
      threat,
      threatPct,
      timerText: toTimerText(timerRemaining),
      queueCount: (runtime.spawnQueue || []).length,
      selectedRouteKey: runtime.selectedRouteKey || 'route1',
      selectedLane: runtime.selectedPlaneLane || 'middle',
      routes: this.getCommanderRouteOptions?.() || [],
      spawnLabels,
      spawnEnabled,
      disableAll: this.gameState?.gameOver || !this.isMultiplayerModeEnabled(),
    });
  }
}

export function teardownMultiplayerCommanderOverlay() {
  closeOnlineMatchSocket(this.multiplayerRuntime);

  if (this.htmlMultiplayerResizeHandler && typeof window !== 'undefined') {
    window.removeEventListener('resize', this.htmlMultiplayerResizeHandler);
  }
  if (this.htmlMultiplayerScaleResizeHandler && this.scale) {
    this.scale.off('resize', this.htmlMultiplayerScaleResizeHandler);
  }

  this.htmlMultiplayerResizeHandler = null;
  this.htmlMultiplayerScaleResizeHandler = null;

  if (this.htmlMultiplayerRoot?.isConnected) {
    this.htmlMultiplayerRoot.remove();
  }

  this.htmlMultiplayerRoot = null;
  this.htmlMultiplayerOverlayNode = null;
  this.htmlMultiplayerValues = null;
  this.nextMultiplayerHudUpdateAt = 0;

  this.clearEnemySpawnEntrances?.();
}

