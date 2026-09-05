import {
  BASE_HEIGHT,
  BASE_WIDTH,
  BOARD_HEIGHT,
  BOARD_WIDTH,
  DEBUG_FLAGS,
} from './game-config-constants';
import { createBoardScalers } from './game-core-utils';

const { sx, sy } = createBoardScalers({
  baseWidth: BASE_WIDTH,
  baseHeight: BASE_HEIGHT,
  boardWidth: BOARD_WIDTH,
  boardHeight: BOARD_HEIGHT,
});

export function update() {
    this.animateWorldOneSmoke(this.game?.loop?.delta || 16);

    if (this.gameState.gameOver) {
      this.stopTankEngineLoop();
      return;
    }

    if (this.gameplayPauseActive) {
      this.stopTankEngineLoop();
      return;
    }

    this.lakeShimmers.forEach((item, index) => {
      item.sprite.alpha = item.baseAlpha + Math.sin(this.time.now * item.speed + index) * 0.05;
      item.sprite.x += Math.sin(this.time.now * 0.0005 + index) * 0.02;
    });

    const activeWaveEnemies = this.enemies.children.entries.filter((enemy) => enemy.active && !enemy.getData('isTestDummy'));
    const laneCleared = activeWaveEnemies.length === 0;
    const minimumConcurrentEnemies = 3;
    const needsSpawnPressure = activeWaveEnemies.length < minimumConcurrentEnemies;
    const multiplayerWaveActive = !!(
      this.isMultiplayerModeEnabled?.()
      && this.multiplayerRuntime?.waveActive
      && !this.gameState.prepPhase
    );
    const spawningStep = multiplayerWaveActive
      ? (this.multiplayerRuntime?.spawnQueue?.[0] || null)
      : ((this.spawnPlan && this.spawnPlan[this.spawnPlanIndex]) || null);
    const barrageEnemiesActive = activeWaveEnemies.some((enemy) => {
      if (!enemy.getData('isBarrage')) {
        return false;
      }
      if (!enemy.visible || (enemy.alpha ?? 1) <= 0.05) {
        return false;
      }
      if (enemy.x < -sx(28) || enemy.x > BOARD_WIDTH + sx(28) || enemy.y < -sy(28) || enemy.y > BOARD_HEIGHT + sy(28)) {
        return false;
      }
      return true;
    });
    const barrageSpawningNow = !!(spawningStep && spawningStep.isBarrage);
    this.barrageLightningWindowOpen = !this.gameState.prepPhase && (barrageEnemiesActive || barrageSpawningNow);
    const lightningSource = this.lightningLandmarkSprite && this.lightningLandmarkSprite.active
      ? this.lightningLandmarkSprite
      : null;
    const triggerAnchors = [];
    if (lightningSource) {
      triggerAnchors.push({ x: lightningSource.x, y: lightningSource.y });
    }
    const routePaths = Array.isArray(this.customSpawnRoutes) && this.customSpawnRoutes.length > 0
      ? this.customSpawnRoutes.map((route) => route.path)
      : [this.path, this.secondaryPath, this.tertiaryPath, this.quaternaryPath];
    routePaths.forEach((routePath) => {
      if (Array.isArray(routePath) && routePath[0]) {
        triggerAnchors.push({ x: routePath[0].x, y: routePath[0].y });
      }
    });
    const lightningTriggerRadius = sx(220);
    this.barrageNearLightningTower = !!(
      this.barrageLightningWindowOpen
      && triggerAnchors.length > 0
      && activeWaveEnemies.some((enemy) => {
        if (!enemy.getData('isBarrage')) {
          return false;
        }
        if (!enemy.visible || (enemy.alpha ?? 1) <= 0.05) {
          return false;
        }
        if (enemy.x < -sx(28) || enemy.x > BOARD_WIDTH + sx(28) || enemy.y < -sy(28) || enemy.y > BOARD_HEIGHT + sy(28)) {
          return false;
        }
        const isPlane = !!enemy.getData('isPlane') || enemy.getData('enemyType') === 'plane';
        const triggerRadius = isPlane ? lightningTriggerRadius * 1.45 : lightningTriggerRadius;
        const triggerRadiusSq = triggerRadius * triggerRadius;
        return triggerAnchors.some((anchor) => {
          const dx = enemy.x - anchor.x;
          const dy = enemy.y - anchor.y;
          return ((dx * dx) + (dy * dy)) <= triggerRadiusSq;
        });
      })
    );

    if (multiplayerWaveActive) {
      this.updateMultiplayerWaveRuntime?.(activeWaveEnemies, laneCleared);
    }

    const lowCountStalled = needsSpawnPressure
      && this.lastSpawnMeta
      && (this.time.now - this.lastSpawnMeta.spawnTime >= 180);
    if (!multiplayerWaveActive && !this.gameState.prepPhase && this.enemiesSpawned < this.enemyCount && lowCountStalled && this.nextEnemyTime > this.time.now) {
      this.nextEnemyTime = this.time.now - 1;
    }

    if (!multiplayerWaveActive && !this.gameState.prepPhase && this.enemiesSpawned < this.enemyCount && this.time.now > this.nextEnemyTime) {
      let spawnIterationsLeft = 10;
      while (
        !multiplayerWaveActive
        && !this.gameState.prepPhase
        && this.enemiesSpawned < this.enemyCount
        && this.time.now >= (this.nextEnemyTime || 0)
        && spawnIterationsLeft > 0
      ) {
        const defaultSpawnStep = {
          enemyType: 'soldier',
          delayAfter: this.spawnBatchIntraGap || 90,
          minGapFromPrev: 0,
        };
        const lastSpawnMetaByRoute = this.lastSpawnMetaByRoute || (this.lastSpawnMetaByRoute = {});

        const evaluateCanSpawnStep = (step) => {
          const routeKey = String(step?.forcedRouteKey || 'route1');
          const routeLastSpawnMetaInner = lastSpawnMetaByRoute[routeKey] || null;
          const enemyType = String(step?.enemyType || 'soldier');
          const queuedArmored = enemyType === 'tank' || enemyType === 'humvee';
          const previousEnemyTypeInner = String(routeLastSpawnMetaInner?.enemyType || '');
          const previousWasArmoredInner = previousEnemyTypeInner === 'tank' || previousEnemyTypeInner === 'humvee';
          const baseMovementGate = queuedArmored ? sx(96) : sx(28);
          const vehiclePairGate = (queuedArmored && previousWasArmoredInner) ? sx(138) : 0;
          const requiredGapInner = Math.max(Number(step?.minGapFromPrev || 0), baseMovementGate, vehiclePairGate);

          let allowed = true;
          if (requiredGapInner > 0 && routeLastSpawnMetaInner) {
            const prevEnemyInner = routeLastSpawnMetaInner.enemy;
            let traveledInner = 0;
            if (prevEnemyInner?.active) {
              traveledInner = Math.max(0, this.getEnemyPathDistance(prevEnemyInner));
            } else {
              const elapsedSecInner = Math.max(0, (this.time.now - (routeLastSpawnMetaInner.spawnTime || this.time.now)) / 1000);
              traveledInner = elapsedSecInner * (routeLastSpawnMetaInner.speed || 0);
            }
            allowed = traveledInner >= requiredGapInner;
          }

          if (allowed && queuedArmored) {
            const minArmoredRouteHeadway = enemyType === 'tank' ? sx(128) : sx(112);
            let closestArmoredAheadDistance = Number.POSITIVE_INFINITY;

            this.enemies.children.entries.forEach((enemy) => {
              if (!enemy?.active || enemy.getData('isPlane') || enemy.getData('isTestDummy')) {
                return;
              }
              const otherType = String(enemy.getData('enemyType') || '');
              if (otherType !== 'tank' && otherType !== 'humvee') {
                return;
              }
              if (String(enemy.getData('routeKey') || 'route1') !== routeKey) {
                return;
              }

              const distanceAlongRoute = Math.max(0, this.getEnemyPathDistance(enemy));
              if (distanceAlongRoute < closestArmoredAheadDistance) {
                closestArmoredAheadDistance = distanceAlongRoute;
              }
            });

            if (closestArmoredAheadDistance < minArmoredRouteHeadway) {
              allowed = false;
            }
          }

          return {
            allowed,
            routeKey,
            enemyType,
          };
        };

        const spawnPlan = this.spawnPlan || [];
        let selectedSpawnIndex = this.spawnPlanIndex;
        let spawnStep = spawnPlan[selectedSpawnIndex] || defaultSpawnStep;
        let spawnCheck = evaluateCanSpawnStep(spawnStep);

        if (!spawnCheck.allowed && Array.isArray(spawnPlan) && spawnPlan.length > (this.spawnPlanIndex + 1)) {
          const blockedRoute = spawnCheck.routeKey;
          const maxProbeIndex = Math.min(spawnPlan.length - 1, this.spawnPlanIndex + 24);
          for (let probeIndex = this.spawnPlanIndex + 1; probeIndex <= maxProbeIndex; probeIndex += 1) {
            const candidateStep = spawnPlan[probeIndex];
            if (!candidateStep) {
              continue;
            }
            const candidateCheck = evaluateCanSpawnStep(candidateStep);
            if (!candidateCheck.allowed) {
              continue;
            }
            if (candidateCheck.routeKey === blockedRoute) {
              continue;
            }
            selectedSpawnIndex = probeIndex;
            spawnStep = candidateStep;
            spawnCheck = candidateCheck;
            break;
          }
        }

        const canSpawn = !!spawnCheck.allowed;
        // Hold spawning if there are already too many active ground units on the map.
        const activeGroundCount = this.enemies.children.entries.filter(
          (e) => e?.active && !e.getData('isPlane') && !e.getData('isTestDummy')
        ).length;
        const spawnCap = 10 + Math.floor((this.gameState?.wave || 1) * 0.9);
        if (canSpawn && activeGroundCount >= spawnCap) {
          this.nextEnemyTime = this.time.now + 600;
          break;
        }
        const spawnRouteKey = spawnCheck.routeKey;
        const queuedEnemyType = spawnCheck.enemyType;

        if (!canSpawn) {
          this.nextEnemyTime = this.time.now + 16;
          break;
        }

        if (selectedSpawnIndex !== this.spawnPlanIndex && Array.isArray(this.spawnPlan)) {
          const selectedStep = this.spawnPlan[selectedSpawnIndex];
          this.spawnPlan.splice(selectedSpawnIndex, 1);
          this.spawnPlan.splice(this.spawnPlanIndex, 0, selectedStep);
          spawnStep = selectedStep;
        }

        if (spawnStep.isBarrage && spawnStep.barrageTag && this.lastAnnouncedBarrageTag !== spawnStep.barrageTag) {
          this.lastAnnouncedBarrageTag = spawnStep.barrageTag;
          this.setStatus('⚠ MAJOR BARRAGE ' + (spawnStep.barrageIndex || 1) + ' incoming! Massive influx on all routes - trigger LIGHTNING now.', '#ff9548');
        }
        const spawned = this.spawnEnemy(spawnStep.enemyType, spawnStep);

        if (spawnStep.enemyType === 'soldier') {
          this.currentBatchSpawned = (this.currentBatchSpawned || 0) + 1;
          if (this.currentBatchSpawned >= (this.spawnBatchSize || 10)) {
            this.currentBatchIndex = (this.currentBatchIndex || 0) + 1;
            this.currentBatchSpawned = 0;
          }
        }

        this.lastSpawnMeta = {
          enemy: spawned,
          spawnTime: this.time.now,
          speed: spawned?.getData('speed') || 0,
          enemyType: queuedEnemyType,
          routeKey: spawnRouteKey,
        };
        lastSpawnMetaByRoute[spawnRouteKey] = this.lastSpawnMeta;
        this.spawnStepBlockedSince = 0;

        this.spawnPlanIndex = (this.spawnPlanIndex || 0) + 1;
        this.nextEnemyTime = this.time.now + Math.max(0, Number(spawnStep.delayAfter ?? 90));
        spawnIterationsLeft -= 1;
      }
    }

    if (!this.gameState.prepPhase) {
      this.moveEnemiesAlongPath();
      this.updateTowerFire();
    } else if (DEBUG_FLAGS.fireTestMode) {
      this.moveEnemiesAlongPath();
      this.updateTowerFire();
    }

    this.syncTankEngineLoop();

    if (this.lightningBlobCore && this.time.now >= (this.nextLightningControlRefreshAt || 0)) {
      this.nextLightningControlRefreshAt = this.time.now + 120;
      this.refreshLightningBlobControl();
    }

    this.projectiles.children.entries.forEach((proj) => {
      if (!proj?.active) {
        return;
      }

      if (proj.x > BOARD_WIDTH || proj.x < 0 || proj.y > BOARD_HEIGHT || proj.y < 0) {
        proj.destroy();
        return;
      }

      const launchedAt = Number(proj.getData('firedAt') || 0);
      const ageMs = Math.max(0, (this.time.now || 0) - launchedAt);
      const velocityX = Number(proj.body?.velocity?.x || 0);
      const velocityY = Number(proj.body?.velocity?.y || 0);
      const speed = Math.hypot(velocityX, velocityY);
      const spawnX = Number(proj.getData('spawnX') || proj.x);
      const spawnY = Number(proj.getData('spawnY') || proj.y);
      const distanceFromSpawn = Math.hypot(proj.x - spawnX, proj.y - spawnY);

      if (ageMs > 140 && (!Number.isFinite(speed) || speed < 18 || distanceFromSpawn < 10)) {
        proj.destroy();
        return;
      }

      if (ageMs > 5000) {
        proj.destroy();
      }
    });
    this.updateProjectileTrails();

    this.enemyProjectiles.children.entries.forEach((proj) => {
      if (proj?.active && proj.getData('isGrenade')) {
        const targetTower = proj.getData('targetTower');
        if (targetTower?.active) {
          const targetPoint = this.getTowerTargetPoint?.(targetTower) || { x: targetTower.x, y: targetTower.y };
          const speed = Math.max(
            120,
            Math.hypot(Number(proj.body?.velocity?.x || 0), Number(proj.body?.velocity?.y || 0)),
          );
          if (proj.body) {
            this.physics.moveTo(proj, targetPoint.x, targetPoint.y, speed);
          }
          const dx = targetPoint.x - proj.x;
          const dy = targetPoint.y - proj.y;
          if (((dx * dx) + (dy * dy)) <= (24 * 24)) {
            this.enemyProjectileHitTower(proj, targetTower);
            return;
          }
        }
      }

      if (proj.x > BOARD_WIDTH || proj.x < 0 || proj.y > BOARD_HEIGHT || proj.y < 0) {
        proj.destroy();
      }
    });

    if (!this.gameState.prepPhase) {
      this.updateEnemyFire();
    }

    this.updateFireDebugOverlay();
}
