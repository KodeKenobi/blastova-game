import {
  BASE_HEIGHT,
  BASE_WIDTH,
  BLUEPRINT_AOE_UI_DIVISOR,
  BLUEPRINT_RANGE_UI_FACTOR,
  BLUEPRINT_RUNTIME_STATE_SESSION_FALLBACK_KEY,
  BLUEPRINT_RUNTIME_STATE_STORAGE_KEY,
  BOARD_HEIGHT,
  BOARD_WIDTH,
  TOWER_FIRE_RATE,
  TOWER_MAX_HEALTH,
  TOWER_RANGE,
} from './game-config-constants';
import { createBoardScalers } from './game-core-utils';

const { sx } = createBoardScalers({
  baseWidth: BASE_WIDTH,
  baseHeight: BASE_HEIGHT,
  boardWidth: BOARD_WIDTH,
  boardHeight: BOARD_HEIGHT,
});

export function restoreBlueprintRuntimeState() {
    let raw = null;
    try {
      raw = window?.localStorage?.getItem(BLUEPRINT_RUNTIME_STATE_STORAGE_KEY);
      if (!raw) {
        raw = sessionStorage.getItem(BLUEPRINT_RUNTIME_STATE_SESSION_FALLBACK_KEY);
        if (raw) {
          window?.localStorage?.setItem(BLUEPRINT_RUNTIME_STATE_STORAGE_KEY, raw);
          sessionStorage.removeItem(BLUEPRINT_RUNTIME_STATE_SESSION_FALLBACK_KEY);
        }
      }
    } catch (_) {
      return false;
    }
    if (!raw) {
      return false;
    }

    let saved = null;
    try {
      saved = JSON.parse(raw);
    } catch (_) {
      return false;
    }

    const entries = Object.entries(saved || {});
    if (!entries.length) {
      return false;
    }

    entries.forEach(([weaponName, state]) => {
      const towerDef = this.towerCatalog?.find((item) => item.name === weaponName);
      if (!towerDef || !state?.stats) {
        return;
      }

      const baseAoeRadius = Number(towerDef.rocketSplashRadius || towerDef.splashRadius || towerDef.laserLaneRadius || 0);
      const worldScale = Math.max(0.0001, sx(1));
      const baseStats = {
        damage: Math.max(0, Number(towerDef.baseDamage || towerDef.damage || 0)),
        range: Math.max(0, ((Number(towerDef.range || 0) / Math.max(1, TOWER_RANGE)) * BLUEPRINT_RANGE_UI_FACTOR)),
        fireRate: Math.max(0.01, 1000 / Math.max(1, Number(towerDef.fireRate || TOWER_FIRE_RATE))),
        aoe: Math.max(0, (baseAoeRadius / worldScale) / BLUEPRINT_AOE_UI_DIVISOR),
        health: Math.max(1, TOWER_MAX_HEALTH + Number(towerDef.moduleIntegrity || 0)),
      };

      this.applyBlueprintWeaponRuntimeState({
        name: weaponName,
        tier: Math.max(1, Number(state.tier) || 1),
        turretMk: Math.max(1, Number(state.turretMk) || 1),
        previewTier: Math.max(1, Number(state.previewTier) || Number(state.tier) || 1),
        previousStats: baseStats,
        stats: state.stats,
        evolveState: state.evolveState || null,
      });
    });

    return true;
}
