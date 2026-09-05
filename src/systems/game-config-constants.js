export const BASE_WIDTH = 1000;
export const BASE_HEIGHT = 600;
export const BOARD_WIDTH = 1600;
export const BOARD_HEIGHT = 900;
export const BUILD_COST = 30;
export const TOWER_RANGE = 210;
export const TOWER_MAG_SIZE = 8;
export const TOWER_FIRE_RATE = 480;
export const TOWER_RELOAD_TIME = 1700;
export const TOWER_MAX_HEALTH = 50;
export const ENEMY_BASE_SPEED = 170;
export const ENEMY_FIRE_RANGE = 205;
export const ENEMY_FIRE_RATE = 1050;
export const ENEMY_PROJECTILE_SPEED = 300;
export const FORTRESS_GRID_SIZE = 62;
export const TERRAIN_TILE_SIZE = 128;
export const TERRAIN_ROW_LEVELS = [0, 1, 2, 3, 4];
export const THEME_BY_TERRAIN_ROW = ['Red', 'Blue', 'Camo', 'Desert', 'Purple'];
export const WAVES_PER_PLAYER_LEVEL = 5;
export const GAMEPLAY_VISUAL_SCALE = 0.84;
export const TOWER_GLOBAL_SCALE_MULT = 1.0;
export const TOWER_BASE_VISUAL_SCALE_MULT = 0.65;
export const WORLD2_ENEMY_SCALE_MULT = 0.92;
export const MASTER_AUDIO_ATTENUATION = 0.72;

export const DIFFICULTY_CONFIGS = {
  easy:   { label: 'EASY',   color: '#6dff86', startGold: 400, lives: 5, killGold: 3, waveBonus: 10, enemyHpMult: 1.02, enemySpeedMult: 0.84, scoreMultiplier: 0.6 },
  normal: { label: 'NORMAL', color: '#7dd4ff', startGold: 350, lives: 5, killGold: 2, waveBonus: 7, enemyHpMult: 1.32, enemySpeedMult: 0.94, scoreMultiplier: 1.0 },
  hard:   { label: 'HARD',   color: '#ff7d7d', startGold: 300, lives: 5, killGold: 2, waveBonus: 4, enemyHpMult: 1.95, enemySpeedMult: 1.06, scoreMultiplier: 2.0 },
};

export const COMMANDER_XP_PER_KILL = 2;
export const COMMANDER_XP_PER_WAVE = 30;
export const COMMANDER_XP_PER_CLEAR = 250;
export const SPECIAL_KILL_GOLD_MULTIPLIERS = {
  elite: 1.5,
  plane: 2,
  tank: 2.5,
  humvee: 2,
};
export const BLUEPRINT_AOE_UI_DIVISOR = 10;
export const BLUEPRINT_RANGE_UI_FACTOR = 3.67;
export const BLUEPRINT_RUNTIME_STATE_STORAGE_KEY = 'tdBlueprintRuntimeStateV2';
export const BLUEPRINT_RUNTIME_STATE_SESSION_FALLBACK_KEY = 'tdBlueprintRuntimeStateV1';
export const DEFAULT_WEAPON_BUILD_COST = 55;
export const SUPPLIES_MAX_STASH = 60;
export const SUPPLIES_DROP_RULES = {
  eliteSoldier: { chance: 0.24, min: 1, max: 1 },
  plane: { chance: 0.32, min: 1, max: 2 },
  tank: { chance: 0.38, min: 1, max: 2 },
};
export const WEAPON_POWER_TIER_BANDS = {
  light: { min: 0, max: 1.8, label: 'Light Power' },
  medium: { min: 1.8, max: 3.4, label: 'Medium Power' },
  heavy: { min: 3.4, max: Number.POSITIVE_INFINITY, label: 'Heavy Power' },
};
export const DEBUG_FLAGS = {
  fireTestMode: false,
  lineFx: false,
  exposeSceneHook: true,
  world2LightningTestBypass: false,
  fireDebugOverlay: false,
  deterministicTestScene: false,
  autoFillTestTowers: false,
  overpowerForWaveTesting: false,
  extraGoldForTesting: false,
  testingStartingGold: 0,
  soldiersInvincibleForTesting: false,
  developerUnlocksMaxed: false,
  tower1InvincibleForTesting: false,
  tower1TestWeaponId: 0,
  autoStartWave: false,
};

export const FREE_PLACEMENT_ALL_WAVES = true;
export const DOWNLOADED_WORLD_MAP_COUNT = 12;