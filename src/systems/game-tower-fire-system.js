import Phaser from 'phaser';
import { DEBUG_FLAGS } from './game-config-constants';

export function fireTowerWeapon(tower, target) {
    const pattern = tower.getData('firePattern') || 'single';

    if (pattern === 'spreadRocketBurst') {
      // 1. Center nozzle (lateral: 0, forward: 24) fires the spread-angle bullet fan
      const spreadAngles = tower.getData('spreadAngles') || [-24, -16, -8, 0, 8, 16, 24];
      const burstCount = tower.getData('burstCount') || 1;
      const burstSpacing = tower.getData('burstSpacing') || 50;
      const centerBarrel = { lateral: 0, forward: 24 };

      for (let b = 0; b < burstCount; b++) {
        this.time.delayedCall(b * burstSpacing, () => {
          if (!tower.active) return;
          const dynamicTarget = target.active ? target : this.selectEnemyForTower(tower);
          if (!dynamicTarget) return;

          if (!DEBUG_FLAGS.fireTestMode) {
            tower.setRotation(Phaser.Math.Angle.Between(tower.x, tower.y, dynamicTarget.x, dynamicTarget.y) + Math.PI / 2);
          }

          // All spread bullets originate from the center barrel and radiate outward
          spreadAngles.forEach((angleOffset) => {
            const projectile = this.fireProjectile(tower, dynamicTarget, angleOffset, {
              projectileKey: 'projectile',
              barrelOffset: centerBarrel,
              barrelLateralOffset: 0,
              barrelForwardOffset: 24,
            });
            if (projectile) {
              projectile.setTint(0xffd56f);
              projectile.setBlendMode(Phaser.BlendModes.NORMAL);
              projectile.setScale(1.1);
              projectile.setData('damage', (tower.getData('damage') || 1) * 0.35);
              projectile.setData('splashRadius', 0);
            }
          });
        });
      }

      // 2. 6 Outer Tubes fire 6 straight rockets (3 left, 3 right, 0 spread) after center bursts finish
      this.time.delayedCall((burstCount * burstSpacing) + 50, () => {
        if (tower.active) {
          this.fireRocketSalvo(tower, target);
        }
      });
      return;
    }

    if (pattern === 'rocketBurst') {
      // Fire rapid projectiles AND rockets together
      const burstCount = 3;
      const burstSpacing = 40;
      for (let i = 0; i < burstCount; i++) {
        this.time.delayedCall(i * burstSpacing, () => {
          if (!tower.active) return;
          const dynamicTarget = target.active ? target : this.selectEnemyForTower(tower);
          if (dynamicTarget) {
            const projectile = this.fireProjectile(tower, dynamicTarget, 0);
            if (projectile) {
              projectile.setTint(0xff8844);  // Fire/orange color
              projectile.setBlendMode(Phaser.BlendModes.NORMAL);
            }
          }
        });
      }
      // Also fire rockets after burst completes
      this.time.delayedCall((burstCount * burstSpacing) + 60, () => {
        if (tower.active) {
          this.fireRocketSalvo(tower, target);
        }
      });
      return;
    }

    if (pattern === 'rocket') {
      this.fireRocketSalvo(tower, target);
      return;
    }

    if (pattern === 'laser') {
      this.fireLaserShot(tower, target);
      return;
    }

    if (pattern === 'lance') {
      this.fireLanceShot(tower, target);
      return;
    }

    if (pattern === 'pulsar') {
      this.firePulsarBurst(tower, target);
      return;
    }

    if (pattern === 'burst') {
      const burstCount = tower.getData('burstCount') || 3;
      const burstSpacing = tower.getData('burstSpacing') || 70;
      for (let i = 0; i < burstCount; i++) {
        this.time.delayedCall(i * burstSpacing, () => {
          if (!tower.active) {
            return;
          }
          const dynamicTarget = target.active ? target : this.selectEnemyForTower(tower);
          if (!dynamicTarget) {
            return;
          }
          this.fireProjectile(tower, dynamicTarget, 0, { burstShotIndex: i });
        });
      }
      return;
    }

    if (pattern === 'spread' || pattern === 'double' || pattern === 'nova') {
      const spreadAngles = tower.getData('spreadAngles') || [0];
      spreadAngles.forEach((offset, index) => {
        this.fireProjectile(tower, target, offset, {
          barrelSlot: index,
          barrelCount: spreadAngles.length,
          barrelSpacing: tower.getData('barrelSpacing') || undefined,
        });
      });
      return;
    }

    this.fireProjectile(tower, target);
}

