import { DEBUG_FLAGS } from './game-config-constants';

export function populateTestTowerLoadout() {
  if (!this.towerBaseSlots?.length || !this.towerCatalog?.length) {
    return;
  }

  const fillCount = DEBUG_FLAGS.overpowerForWaveTesting
    ? this.towerBaseSlots.length
    : Math.max(1, Math.floor(this.towerBaseSlots.length * 0.8));
  this.gameState.gold = Math.max(this.gameState.gold, DEBUG_FLAGS.overpowerForWaveTesting ? 99999 : 9999);
  this.updateHud();

  // Get weapon 10 from catalog, or fallback to cycling through catalog
  const testWeapon = this.towerCatalog.find(w => w.id === 10) || this.towerCatalog[0];

  for (let i = 0; i < fillCount; i += 1) {
    const slot = this.towerBaseSlots[i];
    if (!slot || slot.occupied) {
      continue;
    }

    this.tryPlaceTower(slot.x, slot.y, testWeapon);
  }

  this.setStatus(`Test loadout ready: weapon ${testWeapon.id} deployed on towers.`, '#89ffd0');
}

export function recordFireDebugShot(tower, enemy, damageEstimate = 0) {
  if (!DEBUG_FLAGS.fireDebugOverlay) {
    return;
  }

  this.fireDebugLastTowerId = tower?.getData('towerId') || null;
  this.fireDebugLastTargetArmor = enemy?.getData('armorClass') || 'none';
  this.fireDebugShots.push({
    time: this.time.now,
    damage: Math.max(0, damageEstimate || 0),
  });
}

export function updateFireDebugOverlay() {
  if (!this.fireDebugOverlayEnabled || !this.fireDebugOverlayText) {
    return;
  }

  const now = this.time.now;
  this.fireDebugShots = this.fireDebugShots.filter((entry) => now - entry.time <= 3000);
  const shotCount = this.fireDebugShots.length;
  const totalDamage = this.fireDebugShots.reduce((sum, entry) => sum + entry.damage, 0);
  const dps = totalDamage / 3;

  this.fireDebugOverlayText.setText([
    'FIRE DEBUG (F3)',
    'Tower: ' + (this.fireDebugLastTowerId || '-'),
    'Target Armor: ' + (this.fireDebugLastTargetArmor || '-'),
    'Shots (3s): ' + shotCount,
    'DPS est: ' + dps.toFixed(2),
  ].join('\n'));
}