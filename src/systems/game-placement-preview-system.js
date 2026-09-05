import { TOWER_GLOBAL_SCALE_MULT } from './game-config-constants';

export function setupPlacementPreview() {
  this.previewRange = null;
  this.weaponReachGlowLayer = this.add.container(0, 0).setDepth(1.33);
  this.weaponReachGlowLayer.setVisible(false);

  const defaultTower = this.towerCatalog[0] || { key: 'tower', id: 1 };
  this.previewTower = this.add.image(0, 0, defaultTower.key);
  this.previewTower.setScale(0.6 * TOWER_GLOBAL_SCALE_MULT);
  this.previewTower.setAlpha(0.55);
  this.previewTower.setVisible(false);

  this.previewTowerLabel = this.add.text(0, 0, String(defaultTower.id), {
    fontFamily: 'Trebuchet MS',
    fontSize: '12px',
    color: '#f4fbff',
    stroke: '#17202a',
    strokeThickness: 3,
    fontStyle: 'bold',
  }).setOrigin(0.5).setVisible(false).setDepth(10);
}