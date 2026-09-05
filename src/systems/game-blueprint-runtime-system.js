import {
  BLUEPRINT_AOE_UI_DIVISOR,
  TOWER_FIRE_RATE,
  TOWER_MAX_HEALTH,
} from './game-config-constants';

export function applyBlueprintWeaponRuntimeState(payload) {
    const normalizeWeaponName = (value) => String(value || '').trim().toLowerCase();
    const weaponName = payload?.name;
    const normalizedWeaponName = normalizeWeaponName(weaponName);
    if (!weaponName || !this.towerCatalog?.length) {
      return false;
    }

    const towerDef = this.towerCatalog.find((item) => normalizeWeaponName(item.name) === normalizedWeaponName);
    if (!towerDef) {
      return false;
    }

    const normalizeStats = (stats) => {
      if (!stats) {
        return null;
      }
      return {
        damage: Math.max(0, Number(stats.damage) || 0),
        range: Math.max(0, Number(stats.range) || 0),
        fireRate: Math.max(0.01, Number(stats.fireRate) || 0.01),
        aoe: Math.max(0, Number(stats.aoe) || 0),
        health: Math.max(1, Number(stats.health) || 1),
      };
    };
    const cloneState = (state) => JSON.parse(JSON.stringify(state));

    const nextStats = normalizeStats(payload.stats);
    if (!nextStats) {
      return false;
    }

    let storedState = null;
    if (this.blueprintWeaponRuntimeStateByName instanceof Map) {
      for (const [storedName, state] of this.blueprintWeaponRuntimeStateByName.entries()) {
        if (normalizeWeaponName(storedName) === normalizedWeaponName) {
          storedState = state || null;
          break;
        }
      }
    }
    const previousStats = normalizeStats(payload.previousStats) || normalizeStats(storedState?.stats) || nextStats;
    const damageRatio = previousStats.damage > 0 ? nextStats.damage / previousStats.damage : 1;
    const rangeRatio = previousStats.range > 0 ? nextStats.range / previousStats.range : 1;
    const fireRateRatio = previousStats.fireRate > 0 ? nextStats.fireRate / previousStats.fireRate : 1;
    const aoeRatio = previousStats.aoe > 0 ? nextStats.aoe / previousStats.aoe : 1;
    const healthRatio = previousStats.health > 0 ? nextStats.health / previousStats.health : 1;
    const nextFireRateMs = Math.max(90, Math.round(1000 / nextStats.fireRate));
    const nextAoeRadius = Math.max(0, nextStats.aoe * BLUEPRINT_AOE_UI_DIVISOR);

    towerDef.damage = nextStats.damage;
    towerDef.baseDamage = nextStats.damage;
    if (Number.isFinite(rangeRatio) && rangeRatio > 0) {
      towerDef.range = Math.max(1, towerDef.range * rangeRatio);
    }
    towerDef.fireRate = nextFireRateMs;
    if (towerDef.splashRadius) {
      towerDef.splashRadius = previousStats.aoe > 0 && Number.isFinite(aoeRatio) && aoeRatio > 0
        ? Math.max(0, towerDef.splashRadius * aoeRatio)
        : nextAoeRadius;
    }
    if (towerDef.rocketSplashRadius) {
      towerDef.rocketSplashRadius = previousStats.aoe > 0 && Number.isFinite(aoeRatio) && aoeRatio > 0
        ? Math.max(0, towerDef.rocketSplashRadius * aoeRatio)
        : nextAoeRadius;
    }
    if (towerDef.laserLaneRadius) {
      towerDef.laserLaneRadius = previousStats.aoe > 0 && Number.isFinite(aoeRatio) && aoeRatio > 0
        ? Math.max(0, towerDef.laserLaneRadius * aoeRatio)
        : nextAoeRadius;
    }
    towerDef.moduleIntegrity = Math.max(0, Math.round(nextStats.health - TOWER_MAX_HEALTH));

    const powerTier = this.getWeaponPowerTierInfo(towerDef.baseDamage || towerDef.damage || 0);
    towerDef.powerTierKey = powerTier.key;
    towerDef.powerTierLabel = powerTier.label;
    towerDef.blueprintTier = Math.max(1, Number(payload.tier) || 1);
    towerDef.blueprintPreviewTier = Math.max(1, Number(payload.previewTier) || Number(payload.tier) || 1);

    // Keep legacy weapon upgrade levels aligned with blueprint tiers.
    // The between-wave upgrade modal reads weaponUpgradeLevels to decide what is still upgradeable.
    if (!this.gameState) {
      this.gameState = {};
    }
    if (!this.gameState.weaponUpgradeLevels || typeof this.gameState.weaponUpgradeLevels !== 'object') {
      this.gameState.weaponUpgradeLevels = {};
    }
    if (towerDef.key) {
      const currentLevel = Math.max(1, Number(this.gameState.weaponUpgradeLevels[towerDef.key] || 1));
      const blueprintLevel = Math.max(1, Number(payload.tier) || 1);
      this.gameState.weaponUpgradeLevels[towerDef.key] = Math.max(currentLevel, blueprintLevel);
    }

    const placedTowers = this.towers?.children?.entries || [];
    placedTowers.forEach((tower) => {
      if (!tower?.active || tower.getData('towerId') !== towerDef.id) {
        return;
      }

      if (Number.isFinite(damageRatio) && damageRatio > 0) {
        tower.setData('damage', Math.max(0, (Number(tower.getData('damage')) || 0) * damageRatio));
      } else {
        tower.setData('damage', nextStats.damage);
      }

      if (Number.isFinite(rangeRatio) && rangeRatio > 0) {
        tower.setData('range', Math.max(1, (Number(tower.getData('range')) || towerDef.range || 1) * rangeRatio));
      }

      const currentShotsPerSecond = 1000 / Math.max(1, Number(tower.getData('fireRate')) || towerDef.fireRate || TOWER_FIRE_RATE);
      const nextShotsPerSecond = Number.isFinite(fireRateRatio) && fireRateRatio > 0
        ? currentShotsPerSecond * fireRateRatio
        : nextStats.fireRate;
      tower.setData('fireRate', Math.max(90, Math.round(1000 / Math.max(0.01, nextShotsPerSecond))));

      if (tower.getData('splashRadius')) {
        tower.setData('splashRadius', previousStats.aoe > 0 && Number.isFinite(aoeRatio) && aoeRatio > 0
          ? Math.max(0, (Number(tower.getData('splashRadius')) || 0) * aoeRatio)
          : nextAoeRadius);
      }
      if (tower.getData('rocketSplashRadius')) {
        tower.setData('rocketSplashRadius', previousStats.aoe > 0 && Number.isFinite(aoeRatio) && aoeRatio > 0
          ? Math.max(0, (Number(tower.getData('rocketSplashRadius')) || 0) * aoeRatio)
          : nextAoeRadius);
      }
      if (tower.getData('laserLaneRadius')) {
        tower.setData('laserLaneRadius', previousStats.aoe > 0 && Number.isFinite(aoeRatio) && aoeRatio > 0
          ? Math.max(0, (Number(tower.getData('laserLaneRadius')) || 0) * aoeRatio)
          : nextAoeRadius);
      }
      const currentMaxHealth = Math.max(1, Number(tower.getData('maxHealth')) || TOWER_MAX_HEALTH);
      const currentHealth = Math.max(0, Number(tower.getData('health')) || currentMaxHealth);
      const currentHealthRatio = currentMaxHealth > 0 ? currentHealth / currentMaxHealth : 1;
      const nextMaxHealth = Number.isFinite(healthRatio) && healthRatio > 0
        ? Math.max(1, Math.round(currentMaxHealth * healthRatio))
        : Math.max(1, Math.round(nextStats.health));
      tower.setData('maxHealth', nextMaxHealth);
      tower.setData('health', Math.max(1, Math.min(nextMaxHealth, Math.round(nextMaxHealth * currentHealthRatio))));
      tower.setData('sourceTowerDef', towerDef);
    });

    if (!(this.blueprintWeaponRuntimeStateByName instanceof Map)) {
      this.blueprintWeaponRuntimeStateByName = new Map();
    }
    this.blueprintWeaponRuntimeStateByName.set(towerDef.name, cloneState({
      tier: Math.max(1, Number(payload.tier) || 1),
      turretMk: Math.max(1, Number(payload.turretMk) || 1),
      previewTier: Math.max(1, Number(payload.previewTier) || Number(payload.tier) || 1),
      stats: nextStats,
      evolveState: payload.evolveState || null,
    }));
    this.persistBlueprintRuntimeState();

    if (this.selectedTowerDef?.id === towerDef.id) {
      this.selectTowerDef(towerDef, !!this.selectedPlacedTower);
    } else {
      this.refreshSelectedPlacedTowerDetails();
      this.updateTowerBaseIndicators();
    }
    return true;
}
