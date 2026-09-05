import Phaser from 'phaser';
import {
  BUILD_COST,
  GAMEPLAY_VISUAL_SCALE,
  TOWER_BASE_VISUAL_SCALE_MULT,
  TOWER_GLOBAL_SCALE_MULT,
  TOWER_FIRE_RATE,
  TOWER_MAG_SIZE,
  TOWER_MAX_HEALTH,
  TOWER_RANGE,
  TOWER_RELOAD_TIME,
  BASE_HEIGHT,
  BASE_WIDTH,
  BOARD_HEIGHT,
  BOARD_WIDTH,
} from './game-config-constants';
import { WEAPON_VFX_TABLE } from './game-weapon-data';
import { createBoardScalers } from './game-core-utils';

const { sx, sy } = createBoardScalers({
  baseWidth: BASE_WIDTH,
  baseHeight: BASE_HEIGHT,
  boardWidth: BOARD_WIDTH,
  boardHeight: BOARD_HEIGHT,
});

export function tryPlaceTower(x, y, towerDef = null, helpers = {}) {
  const { vibrateImpact } = helpers;
    const bypassRoleLock = !!this.multiplayerRuntime?.allowDefenderBypass;
    if (!bypassRoleLock && this.isMultiplayerEnemyCommanderRole?.()) {
      this.setStatus('Enemy Commander cannot place towers. Issue enemy deployments from the command panel.', '#ffcf8a');
      return false;
    }

    const selectedTower = towerDef || this.towerCatalog[0] || {
      id: 1,
      key: 'tower',
      cost: BUILD_COST,
      range: TOWER_RANGE,
      fireRate: TOWER_FIRE_RATE,
      magSize: TOWER_MAG_SIZE,
      reloadTime: TOWER_RELOAD_TIME,
    };

    if (!this.isWeaponUnlockedForPlayer(selectedTower)) {
      this.setStatus(selectedTower.name + ' is locked until player level ' + selectedTower.unlockLevel + '.', '#ffb18b');
      return false;
    }

    const skipCostForDefenderBot = bypassRoleLock;
    if (!skipCostForDefenderBot && this.gameState.gold < selectedTower.cost) {
      this.setStatus('Insufficient gold to stage another turret.', '#ff8fa7');
      return false;
    }

    const towerBase = this.getAvailableTowerBaseAt(x, y);
    if (!towerBase) {
      this.setStatus(this.lastPlacementFailureReason || 'Invalid position: choose a valid placement area.', '#ffb18b');
      return false;
    }

    const effectiveTower = this.getTowerDefinitionForPlacement(selectedTower);
    if (!effectiveTower) {
      return false;
    }

    const baseTowerScale = 1.5 * GAMEPLAY_VISUAL_SCALE * TOWER_GLOBAL_SCALE_MULT;
    const tower = this.towers.create(towerBase.x, towerBase.y, effectiveTower.key);
    tower.setDepth(2);
    tower.setScale(baseTowerScale);
    tower.setData('range', effectiveTower.range);
    tower.setData('fireRate', effectiveTower.fireRate);
    tower.setData('lastFire', 0);
    tower.setData('magSize', effectiveTower.magSize);
    tower.setData('ammo', Phaser.Math.Between(2, Math.max(2, Math.floor(effectiveTower.magSize * 0.6))));
    tower.setData('reloadTime', effectiveTower.reloadTime);
    tower.setData('damage', effectiveTower.damage || 1);
    tower.setData('firePattern', effectiveTower.firePattern || 'single');
    tower.setData('burstCount', effectiveTower.burstCount || 1);
    tower.setData('burstSpacing', effectiveTower.burstSpacing || 0);
    tower.setData('spreadAngles', effectiveTower.spreadAngles || [0]);
    tower.setData('barrelSpacing', effectiveTower.barrelSpacing || 0);
    tower.setData('projectileSpeed', effectiveTower.projectileSpeed || 380);
    tower.setData('projectileScale', (effectiveTower.projectileScale || 1.15) * GAMEPLAY_VISUAL_SCALE);
    tower.setData('armorPen', effectiveTower.armorPen || 0);
    tower.setData('lightBonus', effectiveTower.lightBonus || 1);
    tower.setData('heavyBonus', effectiveTower.heavyBonus || 1);
    tower.setData('slowAmount', effectiveTower.slowAmount || 0);
    tower.setData('slowDuration', effectiveTower.slowDuration || 0);
    tower.setData('splashRadius', effectiveTower.splashRadius || 0);
    tower.setData('splashDamageFactor', effectiveTower.splashDamageFactor || 0);
    tower.setData('rocketCount', effectiveTower.rocketCount || 0);
    tower.setData('rocketSpread', effectiveTower.rocketSpread || 0);
    tower.setData('rocketInterval', effectiveTower.rocketInterval || 0);

    const resolvedBarrelOffsets = effectiveTower.barrelOffsets || null;
    tower.setData('barrelOffsets', resolvedBarrelOffsets);
    if (resolvedBarrelOffsets && Array.isArray(resolvedBarrelOffsets) && resolvedBarrelOffsets.length > 0) {
      tower.setData('rocketCount', resolvedBarrelOffsets.length);
      tower.setData('barrelLateralOffsets', resolvedBarrelOffsets.map(d => d.lateral ?? d.x ?? 0));
      tower.setData('barrelForwardOffset', resolvedBarrelOffsets[0]?.forward ?? resolvedBarrelOffsets[0]?.y ?? 40);
    } else {
      tower.setData('barrelLateralOffsets', effectiveTower.barrelLateralOffsets || null);
      tower.setData('barrelForwardOffset', effectiveTower.barrelForwardOffset || 0);
    }

    tower.setData('rocketSplashRadius', effectiveTower.rocketSplashRadius || 0);
    tower.setData('rocketSplashDamageFactor', effectiveTower.rocketSplashDamageFactor || 0);
    tower.setData('pierceCount', effectiveTower.pierceCount || 0);
    tower.setData('laserBeamWidth', effectiveTower.laserBeamWidth || 0);
    tower.setData('laserBeamDuration', effectiveTower.laserBeamDuration || 0);
    tower.setData('laserLaneRadius', effectiveTower.laserLaneRadius || 0);
    tower.setData('targetPreference', effectiveTower.targetPreference || 'progress');
    tower.setData('fireAnimKey', effectiveTower.fireAnimKey || null);
    tower.setData('fireAnimSheet', effectiveTower.fireAnimSheet || null);
    tower.setData('towerArmor', effectiveTower.towerArmor || 0);
    tower.setData('reloading', false);
    tower.setData('reloadDoneAt', 0);
    const moduleIntegrity = effectiveTower.moduleIntegrity || 0;
    tower.setData('maxHealth', TOWER_MAX_HEALTH + moduleIntegrity);
    tower.setData('health', TOWER_MAX_HEALTH + moduleIntegrity);
    tower.setData('towerId', selectedTower.id);
    tower.setData('sourceTowerDef', selectedTower);
    tower.setData('upgradeLevel', 1);

    // Apply any weapon upgrades already purchased for this weapon type
    const storedLevel = (this.gameState?.weaponUpgradeLevels?.[selectedTower.key] || 1);
    if (storedLevel > 1) {
      const mult = storedLevel - 1;
      tower.setData('damage',   tower.getData('damage')   * Math.pow(1.3, mult));
      tower.setData('range',    tower.getData('range')    * Math.pow(1.06, mult));
      tower.setData('fireRate', Math.max(90, Math.round(tower.getData('fireRate') * Math.pow(0.88, mult))));
      tower.setData('armorPen', tower.getData('armorPen') + 0.25 * mult);
      tower.setData('upgradeLevel', storedLevel);
    }
    tower.setData('vfxProfile', effectiveTower.vfxProfile || WEAPON_VFX_TABLE[1]);
    tower.setData('baseScale', baseTowerScale);
    tower.setData('towerBase', towerBase);

    const foundationKey = this.textures.exists('gsBaseBlank') ? 'gsBaseBlank' : (this.textures.exists('gsBaseGrass') ? 'gsBaseGrass' : null);
    if (foundationKey) {
      const towerFoundation = this.add.image(towerBase.x, towerBase.y, foundationKey)
        .setScale(1.1 * GAMEPLAY_VISUAL_SCALE * TOWER_BASE_VISUAL_SCALE_MULT)
        .setDepth(1.72)
        .setAlpha(0.96);
      tower.setData('towerFoundation', towerFoundation);
    }

    const towerGroundShadow = this.add.image(towerBase.x, towerBase.y + sy(18), 'shadow')
      .setAlpha(0.46)
      .setScale(0.65 * GAMEPLAY_VISUAL_SCALE * TOWER_BASE_VISUAL_SCALE_MULT)
      .setDepth(1.86);
    tower.setData('towerGroundShadow', towerGroundShadow);

    towerBase.occupied = true;
    this.updateTowerBaseIndicators();

    const towerIdLabel = this.add.text(towerBase.x, towerBase.y - sy(2), String(selectedTower.id), {
      fontFamily: 'Trebuchet MS',
      fontSize: '18px',
      color: '#f6fbff',
      stroke: '#13202a',
      strokeThickness: 3,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(2.2);
    tower.setData('idLabel', towerIdLabel);

    const towerHpBg = this.add.rectangle(towerBase.x, towerBase.y - sy(30), sx(42), sy(6), 0x12070c, 0.9)
      .setDepth(2.25);
    const towerHpFill = this.add.rectangle(towerBase.x - sx(21), towerBase.y - sy(30), sx(42), sy(6), 0x7dffc2, 1)
      .setOrigin(0, 0.5)
      .setDepth(2.3);
    tower.setData('hpBg', towerHpBg);
    tower.setData('hpFill', towerHpFill);

    const regenRate = effectiveTower.regenRate || selectedTower.regenRate || 0;
    if (regenRate > 0) {
      const regenTimer = this.time.addEvent({
        delay: regenRate,
        loop: true,
        callback: () => {
          if (!tower.active) return;
          const hp = tower.getData('health') || 0;
          const maxHp = tower.getData('maxHealth') || TOWER_MAX_HEALTH;
          if (hp < maxHp) {
            tower.setData('health', Math.min(maxHp, hp + 1));
            this.syncTowerHealthVisual(tower);
          }
        },
      });
      tower.setData('regenTimer', regenTimer);
    }

    if (effectiveTower.fireAnimKey && effectiveTower.fireAnimSheet) {
      const fireAnimSprite = this.add.sprite(towerBase.x, towerBase.y, effectiveTower.fireAnimSheet, 0)
        .setDepth(2.14)
        .setScale(baseTowerScale)
        .setVisible(false)
        .setAlpha(0);
      tower.setData('fireAnimSprite', fireAnimSprite);
      tower.setData('fireAnimResetTimer', null);
    }

    this.enablePlacedTowerDrag(tower);

    if (!skipCostForDefenderBot) {
      this.gameState.gold -= selectedTower.cost;
    }
    this.updateHud();
    if (typeof vibrateImpact === 'function') {
      vibrateImpact('Light');
    }
    window.__blastovaOnboarding?.notify('turret-placed');
    return true;
}
